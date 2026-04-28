import dashboardService from "./dashboard.service.js";

const getFilters = async (req, res, next) => {
  try {
    const result = await dashboardService.getFilters();
    res.status(200).json(result).end();
  } catch (e) { next(e); }
};

const getOverview = async (req, res, next) => {
  try {
    const result = await dashboardService.getOverview(req.query);
    res.status(200).json(result).end();
  } catch (e) { next(e); }
};

const getTopRisks = async (req, res, next) => {
  try {
    const result = await dashboardService.getTopRisks(req.query);
    res.status(200).json(result).end();
  } catch (e) { next(e); }
};

const getRecentActivity = async (req, res, next) => {
  try {
    const result = await dashboardService.getRecentActivity(req.query);
    res.status(200).json(result).end();
  } catch (e) { next(e); }
};

const getUnits = async (req, res, next) => {
  try {
    const result = await dashboardService.getUnits(req.query);
    res.status(200).json(result).end();
  } catch (e) { next(e); }
};

const getRisks = async (req, res, next) => {
  try {
    const result = await dashboardService.getRisks(req.query);
    res.status(200).json(result).end();
  } catch (e) { next(e); }
};

export default { getFilters, getOverview, getTopRisks, getRecentActivity, getUnits, getRisks };
