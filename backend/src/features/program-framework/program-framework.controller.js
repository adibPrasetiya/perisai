import programFrameworkService from "./program-framework.service.js";

const addFramework = async (req, res, next) => {
  try {
    const result = await programFrameworkService.addFramework(
      req.params.riskProgramId,
      req.body,
      req.user?.id,
    );
    res.status(201).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const listByProgram = async (req, res, next) => {
  try {
    const result = await programFrameworkService.listByProgram(
      req.params.riskProgramId,
    );
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const result = await programFrameworkService.getById(
      req.params.riskProgramId,
      req.params.programFrameworkId,
    );
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const result = await programFrameworkService.update(
      req.params.riskProgramId,
      req.params.programFrameworkId,
      req.body,
      req.user?.id,
    );
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const listByFramework = async (req, res, next) => {
  try {
    const result = await programFrameworkService.listByFramework(
      req.params.frameworkId,
    );
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await programFrameworkService.remove(
      req.params.riskProgramId,
      req.params.programFrameworkId,
    );
    res.status(200).json({ message: result.message }).end();
  } catch (error) {
    next(error);
  }
};

export default { addFramework, listByProgram, listByFramework, getById, update, remove };
