import express from 'express';

import { getBillingOverview, listBillingInvoices } from '../services/billingPortal.js';
import { getDatabasePool } from '../services/database.js';
import { finalizeEvidenceUpload, initiateEvidenceUpload } from '../services/evidenceIntake.js';
import {
  addEvidenceTag,
  getEvidence,
  listEvidence,
  removeEvidenceTag,
  restoreEvidence,
  softDeleteEvidence
} from '../services/evidenceRepository.js';
import { createEvidenceStorage } from '../services/evidenceStorage.js';
import {
  archiveNotification,
  getNotificationPreferences,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreference
} from '../services/notificationService.js';
import { getUsageSnapshot } from '../services/usageMetering.js';
import {
  createBusinessUnit,
  createFacility,
  createProject,
  createSite,
  getOrganizationProfile,
  listBusinessUnits,
  listFacilities,
  listOrganizationMembers,
  listProjects,
  listSites
} from '../services/platformService.js';

const defaultServices = {
  addEvidenceTag,
  archiveNotification,
  createBusinessUnit,
  createFacility,
  createProject,
  createSite,
  getBillingOverview,
  getOrganizationProfile,
  getEvidence,
  getNotificationPreferences,
  listBusinessUnits,
  listFacilities,
  listOrganizationMembers,
  listProjects,
  listSites,
  listEvidence,
  listBillingInvoices,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  removeEvidenceTag,
  restoreEvidence,
  softDeleteEvidence,
  updateNotificationPreference
};

export function createPlatformRouter(options = {}) {
  if (typeof options.requireSession !== 'function' || typeof options.requireTenant !== 'function') {
    throw new TypeError('Platform routes require session and tenant middleware.');
  }
  const router = express.Router();
  const services = { ...defaultServices, ...options.services };
  const databasePoolResolver = options.databasePoolResolver || getDatabasePool;
  const evidenceStorageResolver = options.evidenceStorageResolver || createEvidenceStorage;

  router.use(options.requireSession, options.requireTenant);

  router.get('/organization', async (request, response, next) => {
    try {
      const organization = await services.getOrganizationProfile(databasePoolResolver(), request.platformContext);
      response.json({ success: true, organization });
    } catch (error) {
      next(error);
    }
  });

  router.get('/members', async (request, response, next) => {
    try {
      const result = await services.listOrganizationMembers(databasePoolResolver(), request.platformContext, {
        page: request.query.page,
        pageSize: request.query.pageSize
      });
      response.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  });

  router.get('/projects', async (request, response, next) => {
    try {
      const result = await services.listProjects(databasePoolResolver(), request.platformContext, {
        page: request.query.page,
        pageSize: request.query.pageSize,
        status: request.query.status,
        productModule: request.query.productModule
      });
      response.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  });

  router.post('/projects', async (request, response, next) => {
    try {
      const project = await services.createProject(databasePoolResolver(), request.platformContext, request.body || {});
      response.status(201).json({ success: true, project });
    } catch (error) {
      next(error);
    }
  });

  addCollectionRoutes(router, '/business-units', services.listBusinessUnits, services.createBusinessUnit, databasePoolResolver);
  addCollectionRoutes(router, '/sites', services.listSites, services.createSite, databasePoolResolver);
  addCollectionRoutes(router, '/facilities', services.listFacilities, services.createFacility, databasePoolResolver, (request) => ({
    siteId: request.query.siteId
  }));

  router.post('/evidence/uploads', async (request, response, next) => {
    try {
      const upload = await (options.services?.initiateEvidenceUpload || initiateEvidenceUpload)(
        databasePoolResolver(), request.platformContext, evidenceStorageResolver(), request.body || {}
      );
      response.status(201).json({ success: true, upload });
    } catch (error) {
      next(error);
    }
  });

  router.post('/evidence/uploads/:uploadId/finalize', async (request, response, next) => {
    try {
      const evidence = await (options.services?.finalizeEvidenceUpload || finalizeEvidenceUpload)(
        databasePoolResolver(), request.platformContext, evidenceStorageResolver(), request.params.uploadId
      );
      response.json({ success: true, evidence });
    } catch (error) {
      next(error);
    }
  });

  router.get('/evidence', async (request, response, next) => {
    try {
      const result = await services.listEvidence(databasePoolResolver(), request.platformContext, {
        page: request.query.page,
        pageSize: request.query.pageSize,
        projectId: request.query.projectId,
        documentType: request.query.documentType,
        classificationStatus: request.query.classificationStatus,
        extractionStatus: request.query.extractionStatus,
        malwareScanStatus: request.query.malwareScanStatus,
        tag: request.query.tag,
        query: request.query.query,
        includeDeleted: request.query.includeDeleted
      });
      response.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  });

  router.get('/evidence/:evidenceId', async (request, response, next) => {
    try {
      const evidence = await services.getEvidence(databasePoolResolver(), request.platformContext, request.params.evidenceId);
      response.json({ success: true, evidence });
    } catch (error) {
      next(error);
    }
  });

  router.post('/evidence/:evidenceId/tags', async (request, response, next) => {
    try {
      const tag = await services.addEvidenceTag(databasePoolResolver(), request.platformContext, request.params.evidenceId, request.body || {});
      response.status(tag.created ? 201 : 200).json({ success: true, tag });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/evidence/:evidenceId/tags/:tag', async (request, response, next) => {
    try {
      const result = await services.removeEvidenceTag(databasePoolResolver(), request.platformContext, request.params.evidenceId, request.params.tag);
      response.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/evidence/:evidenceId', async (request, response, next) => {
    try {
      const deletion = await services.softDeleteEvidence(databasePoolResolver(), request.platformContext, request.params.evidenceId, request.body || {});
      response.json({ success: true, deletion });
    } catch (error) {
      next(error);
    }
  });

  router.post('/evidence/:evidenceId/restore', async (request, response, next) => {
    try {
      const restoration = await services.restoreEvidence(databasePoolResolver(), request.platformContext, request.params.evidenceId);
      response.json({ success: true, restoration });
    } catch (error) {
      next(error);
    }
  });

  router.get('/billing', async (request, response, next) => {
    try {
      const billing = await services.getBillingOverview(databasePoolResolver(), request.platformContext);
      response.json({ success: true, billing });
    } catch (error) { next(error); }
  });

  router.get('/billing/invoices', async (request, response, next) => {
    try {
      const result = await services.listBillingInvoices(databasePoolResolver(), request.platformContext, {
        page: request.query.page, pageSize: request.query.pageSize
      });
      response.json({ success: true, ...result });
    } catch (error) { next(error); }
  });

  router.get('/billing/usage', async (request, response, next) => {
    try {
      const usage = await (options.services?.getUsageSnapshot || getUsageSnapshot)(databasePoolResolver(), request.platformContext);
      response.json({ success: true, usage });
    } catch (error) { next(error); }
  });

  router.get('/notifications', async (request, response, next) => {
    try {
      const result = await services.listNotifications(databasePoolResolver(), request.platformContext, {
        page: request.query.page, pageSize: request.query.pageSize,
        category: request.query.category, unreadOnly: request.query.unreadOnly
      });
      response.json({ success: true, ...result });
    } catch (error) { next(error); }
  });

  router.get('/notifications/preferences', async (request, response, next) => {
    try {
      const preferences = await services.getNotificationPreferences(databasePoolResolver(), request.platformContext);
      response.json({ success: true, preferences });
    } catch (error) { next(error); }
  });

  router.put('/notifications/preferences/:category', async (request, response, next) => {
    try {
      const preference = await services.updateNotificationPreference(
        databasePoolResolver(), request.platformContext, request.params.category, request.body || {}
      );
      response.json({ success: true, preference });
    } catch (error) { next(error); }
  });

  router.post('/notifications/read-all', async (request, response, next) => {
    try {
      const result = await services.markAllNotificationsRead(databasePoolResolver(), request.platformContext);
      response.json({ success: true, ...result });
    } catch (error) { next(error); }
  });

  router.post('/notifications/:notificationId/read', async (request, response, next) => {
    try {
      const notification = await services.markNotificationRead(
        databasePoolResolver(), request.platformContext, request.params.notificationId
      );
      response.json({ success: true, notification });
    } catch (error) { next(error); }
  });

  router.delete('/notifications/:notificationId', async (request, response, next) => {
    try {
      const notification = await services.archiveNotification(
        databasePoolResolver(), request.platformContext, request.params.notificationId
      );
      response.json({ success: true, notification });
    } catch (error) { next(error); }
  });

  return router;
}

function addCollectionRoutes(router, path, listService, createService, databasePoolResolver, extraOptions = () => ({})) {
  router.get(path, async (request, response, next) => {
    try {
      const result = await listService(databasePoolResolver(), request.platformContext, {
        page: request.query.page,
        pageSize: request.query.pageSize,
        ...extraOptions(request)
      });
      response.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  });
  router.post(path, async (request, response, next) => {
    try {
      const resource = await createService(databasePoolResolver(), request.platformContext, request.body || {});
      response.status(201).json({ success: true, resource });
    } catch (error) {
      next(error);
    }
  });
}
