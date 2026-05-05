import riskContextService from "./risk-context.service.js";

// ─── Context ──────────────────────────────────────────────────────────────────

const createFull = async (req, res, next) => {
  try {
    const result = await riskContextService.createFull(
      req.params.frameworkId,
      req.body,
      req.user?.id,
    );
    res.status(201).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const listByFramework = async (req, res, next) => {
  try {
    const result = await riskContextService.listByFramework(req.params.frameworkId);
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const listByProgramFramework = async (req, res, next) => {
  try {
    const result = await riskContextService.listByProgramFramework(req.params.programFrameworkId);
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const result = await riskContextService.getById(req.params.contextId);
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const result = await riskContextService.update(
      req.params.contextId,
      req.body,
      req.user?.id,
    );
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await riskContextService.remove(req.params.contextId);
    res.status(200).json({ message: result.message }).end();
  } catch (error) {
    next(error);
  }
};

const activate = async (req, res, next) => {
  try {
    const result = await riskContextService.activate(req.params.contextId);
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const deactivate = async (req, res, next) => {
  try {
    const result = await riskContextService.deactivate(req.params.contextId);
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

// ─── Risk Categories ──────────────────────────────────────────────────────────

const createCategory = async (req, res, next) => {
  try {
    const result = await riskContextService.createCategory(req.params.contextId, req.body);
    res.status(201).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const result = await riskContextService.updateCategory(
      req.params.contextId,
      req.params.categoryId,
      req.body,
    );
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const removeCategory = async (req, res, next) => {
  try {
    const result = await riskContextService.removeCategory(
      req.params.contextId,
      req.params.categoryId,
    );
    res.status(200).json({ message: result.message }).end();
  } catch (error) {
    next(error);
  }
};

// ─── Likelihood Criteria ──────────────────────────────────────────────────────

const createLikelihoodCriteria = async (req, res, next) => {
  try {
    const result = await riskContextService.createLikelihoodCriteria(
      req.params.contextId,
      req.params.areaId,
      req.body,
    );
    res.status(201).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const updateLikelihoodCriteria = async (req, res, next) => {
  try {
    const result = await riskContextService.updateLikelihoodCriteria(
      req.params.contextId,
      req.params.areaId,
      req.params.criteriaId,
      req.body,
    );
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const removeLikelihoodCriteria = async (req, res, next) => {
  try {
    const result = await riskContextService.removeLikelihoodCriteria(
      req.params.contextId,
      req.params.areaId,
      req.params.criteriaId,
    );
    res.status(200).json({ message: result.message }).end();
  } catch (error) {
    next(error);
  }
};

// ─── Impact Areas ─────────────────────────────────────────────────────────────

const createImpactArea = async (req, res, next) => {
  try {
    const result = await riskContextService.createImpactArea(req.params.contextId, req.body);
    res.status(201).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const updateImpactArea = async (req, res, next) => {
  try {
    const result = await riskContextService.updateImpactArea(
      req.params.contextId,
      req.params.areaId,
      req.body,
    );
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const removeImpactArea = async (req, res, next) => {
  try {
    const result = await riskContextService.removeImpactArea(
      req.params.contextId,
      req.params.areaId,
    );
    res.status(200).json({ message: result.message }).end();
  } catch (error) {
    next(error);
  }
};

// ─── Impact Criteria ──────────────────────────────────────────────────────────

const createImpactCriteria = async (req, res, next) => {
  try {
    const result = await riskContextService.createImpactCriteria(
      req.params.contextId,
      req.params.areaId,
      req.body,
    );
    res.status(201).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const updateImpactCriteria = async (req, res, next) => {
  try {
    const result = await riskContextService.updateImpactCriteria(
      req.params.contextId,
      req.params.areaId,
      req.params.criteriaId,
      req.body,
    );
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const removeImpactCriteria = async (req, res, next) => {
  try {
    const result = await riskContextService.removeImpactCriteria(
      req.params.contextId,
      req.params.areaId,
      req.params.criteriaId,
    );
    res.status(200).json({ message: result.message }).end();
  } catch (error) {
    next(error);
  }
};

// ─── Treatment Options ────────────────────────────────────────────────────────

const createTreatmentOption = async (req, res, next) => {
  try {
    const result = await riskContextService.createTreatmentOption(
      req.params.contextId,
      req.body,
    );
    res.status(201).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const updateTreatmentOption = async (req, res, next) => {
  try {
    const result = await riskContextService.updateTreatmentOption(
      req.params.contextId,
      req.params.optionId,
      req.body,
    );
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const removeTreatmentOption = async (req, res, next) => {
  try {
    const result = await riskContextService.removeTreatmentOption(
      req.params.contextId,
      req.params.optionId,
    );
    res.status(200).json({ message: result.message }).end();
  } catch (error) {
    next(error);
  }
};

// ─── Matrix ───────────────────────────────────────────────────────────────────

const setMatrix = async (req, res, next) => {
  try {
    const result = await riskContextService.setMatrix(req.params.contextId, req.body);
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

export default {
  createFull, listByFramework, listByProgramFramework, getById, update, remove, activate, deactivate,
  createCategory, updateCategory, removeCategory,
  createLikelihoodCriteria, updateLikelihoodCriteria, removeLikelihoodCriteria,
  createImpactArea, updateImpactArea, removeImpactArea,
  createImpactCriteria, updateImpactCriteria, removeImpactCriteria,
  createTreatmentOption, updateTreatmentOption, removeTreatmentOption,
  setMatrix,
};
