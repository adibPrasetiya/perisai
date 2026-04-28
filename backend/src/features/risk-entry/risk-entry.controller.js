import riskEntryService from "./risk-entry.service.js";

const create = async (req, res, next) => {
  try {
    const result = await riskEntryService.create(
      req.params.workingPaperId,
      req.body,
      req.user,
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const listByWorkingPaper = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const result = await riskEntryService.listByWorkingPaper(
      req.params.workingPaperId,
      req.user,
      { page, limit },
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const result = await riskEntryService.getById(
      req.params.entryId,
      req.user,
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const result = await riskEntryService.update(
      req.params.entryId,
      req.body,
      req.user,
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await riskEntryService.remove(
      req.params.entryId,
      req.user,
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const submitTreatmentPlan = async (req, res, next) => {
  try {
    const result = await riskEntryService.submitTreatmentPlan(
      req.params.entryId,
      req.params.planId,
      req.user,
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const verifyTreatmentPlan = async (req, res, next) => {
  try {
    const result = await riskEntryService.verifyTreatmentPlan(
      req.params.entryId,
      req.params.planId,
      req.user,
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const createInherentAssessment = async (req, res, next) => {
  try {
    const result = await riskEntryService.createOrUpdateInherentAssessment(
      req.params.entryId,
      req.body,
      req.user,
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const createResidualAssessment = async (req, res, next) => {
  try {
    const result = await riskEntryService.createOrUpdateResidualAssessment(
      req.params.entryId,
      req.body,
      req.user,
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const createTreatmentPlans = async (req, res, next) => {
  try {
    const result = await riskEntryService.createOrUpdateTreatmentPlans(
      req.params.entryId,
      req.body,
      req.user,
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const completeTreatmentPlan = async (req, res, next) => {
  try {
    const result = await riskEntryService.completeTreatmentPlan(
      req.params.entryId,
      req.params.planId,
      req.body,
      req.user,
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export default { create, listByWorkingPaper, getById, update, remove, submitTreatmentPlan, verifyTreatmentPlan, createInherentAssessment, createResidualAssessment, createTreatmentPlans, completeTreatmentPlan };
