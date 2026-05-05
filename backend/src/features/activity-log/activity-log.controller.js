import activityLogService from "./activity-log.service.js";

const list = async (req, res, next) => {
  try {
    const result = await activityLogService.list(req.query);
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

export default { list };
