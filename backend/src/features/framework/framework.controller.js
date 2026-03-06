import frameworkService from "./framework.service.js";

const create = async (req, res, next) => {
  try {
    const result = await frameworkService.create(req.body);
    res.status(201).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const search = async (req, res, next) => {
  try {
    const result = await frameworkService.search(req.query);
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

const update = async (req, res, next) => {
  try {
    const result = await frameworkService.update(
      req.params.frameworkId,
      req.body,
    );
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const activate = async (req, res, next) => {
  try {
    const result = await frameworkService.activate(req.params.frameworkId);
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const deactivate = async (req, res, next) => {
  try {
    const result = await frameworkService.deactivate(req.params.frameworkId);
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await frameworkService.remove(req.params.frameworkId);
    res.status(200).json({ message: result.message }).end();
  } catch (error) {
    next(error);
  }
};

export default { create, search, update, activate, deactivate, remove };
