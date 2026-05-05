import workingPaperService from "./working-paper.service.js";
import { generateRiskRegisterPdf } from "./working-paper.report.js";

const create = async (req, res, next) => {
  try {
    const result = await workingPaperService.create(req.body, req.user);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const search = async (req, res, next) => {
  try {
    const result = await workingPaperService.search(req.query, req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const result = await workingPaperService.getById(
      req.params.workingPaperId,
      req.user,
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const result = await workingPaperService.update(
      req.params.workingPaperId,
      req.body,
      req.user,
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getStats = async (req, res, next) => {
  try {
    const result = await workingPaperService.getStats(
      req.params.workingPaperId,
      req.user,
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const generateReport = async (req, res, next) => {
  try {
    const { paper, entries, picUsers } = await workingPaperService.getReportData(
      req.params.workingPaperId,
      req.user,
    );
    const safeTitle = `${paper.unitKerja.code}-${paper.program.year}`.replace(/[^a-zA-Z0-9-_]/g, "_");
    const filename = `Register-Risiko-${safeTitle}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    const doc = generateRiskRegisterPdf(paper, entries, picUsers);
    doc.pipe(res);
    doc.end();
  } catch (error) {
    next(error);
  }
};

export default { create, search, getById, update, getStats, generateReport };
