import systemConfigService from "./system-config.service.js";

const getAll = async (req, res, next) => {
  try {
    const result = await systemConfigService.getAll();
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const updateValue = async (req, res, next) => {
  try {
    const result = await systemConfigService.updateValue(
      req.params.key,
      req.body,
      req.user.id,
    );
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

export default { getAll, updateValue };
