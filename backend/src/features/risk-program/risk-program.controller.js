import riskProgramService from "./risk-program.service.js";

const create = async (req, res, next) => {
  try {
    const result = await riskProgramService.create(req.body, req.user?.id);
    res.status(201).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const search = async (req, res, next) => {
  try {
    const result = await riskProgramService.search(req.query);
    res
      .status(200)
      .json({
        message: result.message,
        data: result.data,
        pagination: result.pagination,
      })
      .end();
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const result = await riskProgramService.getById(req.params.riskProgramId);
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const result = await riskProgramService.update(
      req.params.riskProgramId,
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
    const result = await riskProgramService.remove(req.params.riskProgramId);
    res.status(200).json({ message: result.message }).end();
  } catch (error) {
    next(error);
  }
};

const activate = async (req, res, next) => {
  try {
    const result = await riskProgramService.activate(req.params.riskProgramId, req.user?.id);
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const deactivate = async (req, res, next) => {
  try {
    const result = await riskProgramService.deactivate(req.params.riskProgramId, req.user?.id);
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const setDraft = async (req, res, next) => {
  try {
    const result = await riskProgramService.setDraft(req.params.riskProgramId, req.user?.id);
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

export default { create, search, getById, update, remove, activate, deactivate, setDraft };
