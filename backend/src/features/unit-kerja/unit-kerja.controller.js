import unitKerjaService from "./unit-kerja.service.js";

const create = async (req, res, next) => {
  try {
    const result = await unitKerjaService.create(req.body);
    res
      .status(201)
      .json({
        message: result.message,
        data: result.data,
      })
      .end();
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const result = await unitKerjaService.update(
      req.params.unitKerjaId,
      req.body,
    );
    res
      .status(200)
      .json({
        message: result.message,
        data: result.data,
      })
      .end();
  } catch (error) {
    next(error);
  }
};

const search = async (req, res, next) => {
  try {
    const result = await unitKerjaService.search(req.query);
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

const remove = async (req, res, next) => {
  try {
    const result = await unitKerjaService.remove(req.params.unitKerjaId);
    res
      .status(200)
      .json({
        message: result.message,
      })
      .end();
  } catch (error) {
    next(error);
  }
};

export default { create, update, search, remove };
