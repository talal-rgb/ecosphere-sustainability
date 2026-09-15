export function createPortalApi(origin, fetchImplementation = fetch) {
  const baseUrl = new URL(origin, window.location.href).origin;

  async function request(path, organizationId) {
    const headers = { Accept: 'application/json' };
    if (organizationId) headers['X-Terrnix-Organization-ID'] = organizationId;
    const response = await fetchImplementation(`${baseUrl}${path}`, {
      method: 'GET', credentials: 'include', headers
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.error || `Request failed with status ${response.status}.`);
      error.status = response.status;
      error.code = payload.error || 'request_failed';
      throw error;
    }
    return payload;
  }

  return {
    session: () => request('/api/platform/session'),
    organizations: () => request('/api/platform/organizations'),
    async workspace(organizationId) {
      const resources = {
        organization: '/api/platform/organization', access: '/api/platform/access',
        projects: '/api/platform/projects?pageSize=100', facilities: '/api/platform/facilities?pageSize=100',
        evidence: '/api/platform/evidence?pageSize=100', reports: '/api/platform/reports?pageSize=25',
        members: '/api/platform/members?pageSize=100', billing: '/api/platform/billing',
        carbon: '/api/platform/carbon/overview'
      };
      const entries = await Promise.all(Object.entries(resources).map(async ([key, path]) => {
        try { return [key, await request(path, organizationId)]; }
        catch (error) { return [key, { error: error.code, status: error.status }]; }
      }));
      return Object.fromEntries(entries);
    }
  };
}
