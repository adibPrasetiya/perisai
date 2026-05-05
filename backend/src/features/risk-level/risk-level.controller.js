import riskLevelService from "./risk-level.service.js";

const list = async (req, res, next) => {
  try {
    const result = await riskLevelService.list(req.params.contextId);
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const result = await riskLevelService.create(req.params.contextId, req.body);
    res.status(201).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const result = await riskLevelService.update(
      req.params.contextId,
      req.params.levelId,
      req.body,
    );
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await riskLevelService.remove(req.params.contextId, req.params.levelId);
    res.status(200).json({ message: result.message }).end();
  } catch (error) {
    next(error);
  }
};

const bulkSet = async (req, res, next) => {
  try {
    const result = await riskLevelService.bulkSet(req.params.contextId, req.body);
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

export default { list, create, update, remove, bulkSet };
