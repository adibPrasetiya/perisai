import programFrameworkContextService from "./program-framework-context.service.js";

const add = async (req, res, next) => {
  try {
    const result = await programFrameworkContextService.add(
      req.params.programFrameworkId,
      req.body,
      req.user?.id,
    );
    res.status(201).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await programFrameworkContextService.remove(
      req.params.programFrameworkId,
      req.params.riskContextId,
    );
    res.status(200).json({ message: result.message }).end();
  } catch (error) {
    next(error);
  }
};

const list = async (req, res, next) => {
  try {
    const result = await programFrameworkContextService.list(req.params.programFrameworkId);
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

export default { add, remove, list };
