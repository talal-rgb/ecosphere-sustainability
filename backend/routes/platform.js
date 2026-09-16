import express from 'express';

import { getBillingOverview, listBillingInvoices } from '../services/billingPortal.js';
import { getCarbonDashboardOverview } from '../services/carbonProfessional.js';
import {
  createCarbonActivity,
  createCarbonBoundaryMember,
  createCarbonCalculationRun,
  createCarbonInventory,
  createCarbonReportingPeriod,
  getCarbonCalculationRun,
  listCarbonBoundaryMembers,
  listCarbonInventories,
  listCarbonReportingPeriods,
  proposeCarbonFactor,
  reviewCarbonActivity,
  reviewCarbonFactorProposal
} from '../services/carbonWorkflow.js';
import { createEvidenceCalculation, getCalculationLedger } from '../services/calculationLedger.js';
import { getDatabasePool } from '../services/database.js';
import { getEvidenceReview, submitEvidenceReview } from '../services/documentIntelligence.js';
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
import { searchPlatform } from '../services/searchService.js';
import {
  addReportContentVersion,
  createReport,
  getReport,
  listReports,
  listReportTemplates,
  queueReportGeneration
} from '../services/reportEngine.js';
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
  addReportContentVersion,
  archiveNotification,
  createBusinessUnit,
  createCarbonActivity,
  createCarbonBoundaryMember,
  createCarbonCalculationRun,
  createCarbonInventory,
  createCarbonReportingPeriod,
  createEvidenceCalculation,
  createFacility,
  createReport,
  createProject,
  createSite,
  getBillingOverview,
  getCarbonDashboardOverview,
  getCarbonCalculationRun,
  getCalculationLedger,
  getEvidenceReview,
  getOrganizationProfile,
  getEvidence,
  getNotificationPreferences,
  getReport,
  listBusinessUnits,
  listCarbonBoundaryMembers,
  listCarbonInventories,
  listCarbonReportingPeriods,
  listFacilities,
  listOrganizationMembers,
  listProjects,
  listSites,
  listEvidence,
  listBillingInvoices,
  listNotifications,
  listReports,
  listReportTemplates,
  markAllNotificationsRead,
  markNotificationRead,
  queueReportGeneration,
  proposeCarbonFactor,
  searchPlatform,
  removeEvidenceTag,
  restoreEvidence,
  reviewCarbonActivity,
  reviewCarbonFactorProposal,
  softDeleteEvidence,
  submitEvidenceReview,
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

  router.get('/carbon/overview', async (request, response, next) => {
    try {
      const overview = await services.getCarbonDashboardOverview(databasePoolResolver(), request.platformContext);
      response.json({ success: true, overview });
    } catch (error) {
      next(error);
    }
  });

  router.get('/carbon/inventories', async (request, response, next) => {
    try {
      const inventories = await services.listCarbonInventories(databasePoolResolver(), request.platformContext);
      response.json({ success: true, inventories });
    } catch (error) { next(error); }
  });

  router.post('/carbon/inventories', async (request, response, next) => {
    try {
      const inventory = await services.createCarbonInventory(databasePoolResolver(), request.platformContext, request.body || {});
      response.status(201).json({ success: true, inventory });
    } catch (error) { next(error); }
  });

  router.get('/carbon/inventories/:inventoryId/periods', async (request, response, next) => {
    try {
      const periods = await services.listCarbonReportingPeriods(databasePoolResolver(), request.platformContext, request.params.inventoryId);
      response.json({ success: true, periods });
    } catch (error) { next(error); }
  });

  router.post('/carbon/inventories/:inventoryId/periods', async (request, response, next) => {
    try {
      const period = await services.createCarbonReportingPeriod(databasePoolResolver(), request.platformContext, request.params.inventoryId, request.body || {});
      response.status(201).json({ success: true, period });
    } catch (error) { next(error); }
  });

  router.get('/carbon/inventories/:inventoryId/boundary-members', async (request, response, next) => {
    try {
      const boundaryMembers = await services.listCarbonBoundaryMembers(databasePoolResolver(), request.platformContext, request.params.inventoryId);
      response.json({ success: true, boundaryMembers });
    } catch (error) { next(error); }
  });

  router.post('/carbon/inventories/:inventoryId/boundary-members', async (request, response, next) => {
    try {
      const boundaryMember = await services.createCarbonBoundaryMember(databasePoolResolver(), request.platformContext, request.params.inventoryId, request.body || {});
      response.status(201).json({ success: true, boundaryMember });
    } catch (error) { next(error); }
  });

  router.post('/carbon/activities', async (request, response, next) => {
    try {
      const activity = await services.createCarbonActivity(databasePoolResolver(), request.platformContext, request.body || {});
      response.status(201).json({ success: true, activity });
    } catch (error) { next(error); }
  });

  router.post('/carbon/activities/:activityId/review', async (request, response, next) => {
    try {
      const activity = await services.reviewCarbonActivity(databasePoolResolver(), request.platformContext, request.params.activityId, request.body || {});
      response.json({ success: true, activity });
    } catch (error) { next(error); }
  });

  router.post('/carbon/activities/:activityId/factor-proposals', async (request, response, next) => {
    try {
      const proposal = await services.proposeCarbonFactor(databasePoolResolver(), request.platformContext, request.params.activityId, request.body || {});
      response.status(201).json({ success: true, proposal });
    } catch (error) { next(error); }
  });

  router.post('/carbon/factor-proposals/:proposalId/reviews', async (request, response, next) => {
    try {
      const review = await services.reviewCarbonFactorProposal(databasePoolResolver(), request.platformContext, request.params.proposalId, request.body || {});
      response.status(201).json({ success: true, review });
    } catch (error) { next(error); }
  });

  router.post('/carbon/calculation-runs', async (request, response, next) => {
    try {
      const run = await services.createCarbonCalculationRun(databasePoolResolver(), request.platformContext, request.body || {});
      response.status(run.duplicate ? 200 : 201).json({ success: true, run });
    } catch (error) { next(error); }
  });

  router.get('/carbon/calculation-runs/:runId', async (request, response, next) => {
    try {
      const run = await services.getCarbonCalculationRun(databasePoolResolver(), request.platformContext, request.params.runId);
      response.json({ success: true, run });
    } catch (error) { next(error); }
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

  router.get('/evidence/:evidenceId/review', async (request, response, next) => {
    try {
      const review = await services.getEvidenceReview(
        databasePoolResolver(), request.platformContext, request.params.evidenceId
      );
      response.json({ success: true, review });
    } catch (error) {
      next(error);
    }
  });

  router.post('/evidence/:evidenceId/review', async (request, response, next) => {
    try {
      const review = await services.submitEvidenceReview(
        databasePoolResolver(), request.platformContext, request.params.evidenceId, request.body || {}
      );
      response.json({ success: true, review });
    } catch (error) {
      next(error);
    }
  });

  router.post('/evidence/:evidenceId/calculations', async (request, response, next) => {
    try {
      const calculation = await services.createEvidenceCalculation(
        databasePoolResolver(), request.platformContext, request.params.evidenceId, request.body || {}
      );
      response.status(calculation.duplicate ? 200 : 201).json({ success: true, calculation });
    } catch (error) { next(error); }
  });

  router.get('/calculations/:calculationId', async (request, response, next) => {
    try {
      const calculation = await services.getCalculationLedger(
        databasePoolResolver(), request.platformContext, request.params.calculationId
      );
      response.json({ success: true, calculation });
    } catch (error) { next(error); }
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

  router.get('/report-templates', async (request, response, next) => {
    try {
      const templates = await services.listReportTemplates(databasePoolResolver(), request.platformContext);
      response.json({ success: true, templates });
    } catch (error) { next(error); }
  });

  router.get('/reports', async (request, response, next) => {
    try {
      const result = await services.listReports(databasePoolResolver(), request.platformContext, {
        page: request.query.page, pageSize: request.query.pageSize,
        projectId: request.query.projectId, status: request.query.status
      });
      response.json({ success: true, ...result });
    } catch (error) { next(error); }
  });

  router.post('/reports', async (request, response, next) => {
    try {
      const report = await services.createReport(databasePoolResolver(), request.platformContext, request.body || {});
      response.status(201).json({ success: true, report });
    } catch (error) { next(error); }
  });

  router.get('/reports/:reportId', async (request, response, next) => {
    try {
      const report = await services.getReport(databasePoolResolver(), request.platformContext, request.params.reportId);
      response.json({ success: true, report });
    } catch (error) { next(error); }
  });

  router.post('/reports/:reportId/versions', async (request, response, next) => {
    try {
      const version = await services.addReportContentVersion(
        databasePoolResolver(), request.platformContext, request.params.reportId, request.body || {}
      );
      response.status(201).json({ success: true, version });
    } catch (error) { next(error); }
  });

  router.post('/reports/:reportId/generations', async (request, response, next) => {
    try {
      const generation = await services.queueReportGeneration(
        databasePoolResolver(), request.platformContext, request.params.reportId, request.body || {}
      );
      response.status(generation.duplicate ? 200 : 202).json({ success: true, generation });
    } catch (error) { next(error); }
  });

  router.get('/search', async (request, response, next) => {
    try {
      const result = await services.searchPlatform(databasePoolResolver(), request.platformContext, {
        query: request.query.query, types: request.query.types, projectId: request.query.projectId,
        page: request.query.page, pageSize: request.query.pageSize
      });
      response.json({ success: true, ...result });
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
