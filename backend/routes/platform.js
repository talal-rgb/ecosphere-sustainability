import express from 'express';

import { getDatabasePool } from '../services/database.js';
import {
  createProject,
  getOrganizationProfile,
  listOrganizationMembers,
  listProjects
} from '../services/platformService.js';

const defaultServices = {
  createProject,
  getOrganizationProfile,
  listOrganizationMembers,
  listProjects
};

export function createPlatformRouter(options = {}) {
  if (typeof options.requireSession !== 'function' || typeof options.requireTenant !== 'function') {
    throw new TypeError('Platform routes require session and tenant middleware.');
  }
  const router = express.Router();
  const services = { ...defaultServices, ...options.services };
  const databasePoolResolver = options.databasePoolResolver || getDatabasePool;

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

  return router;
}
