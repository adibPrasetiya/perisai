import userService from "./user.service.js";
import { NODE_ENV } from "../../core/config/constant.config.js";

const search = async (req, res, next) => {
  try {
    const result = await userService.search(req.query);
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
    const result = await userService.getById(req.params.userId);
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const verify = async (req, res, next) => {
  try {
    const result = await userService.verify(req.params.userId, req.user.username);
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const activate = async (req, res, next) => {
  try {
    const result = await userService.activate(req.params.userId);
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const deactivate = async (req, res, next) => {
  try {
    const result = await userService.deactivate(req.params.userId, req.user.username);
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const getMyProfile = async (req, res, next) => {
  try {
    const result = await userService.getMyProfile(req.user.username);
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const updateMyPassword = async (req, res, next) => {
  try {
    const result = await userService.updateMyPassword(req.user.username, req.body);

    const cookieOptions = {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: NODE_ENV === "production" ? "strict" : "lax",
    };

    res
      .clearCookie("accessToken", cookieOptions)
      .clearCookie("refreshToken", cookieOptions)
      .status(200)
      .json({ message: result.message })
      .end();
  } catch (error) {
    next(error);
  }
};

const updateMyAccount = async (req, res, next) => {
  try {
    const result = await userService.updateMyAccount(req.user.username, req.body);
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const updateMyProfile = async (req, res, next) => {
  try {
    const result = await userService.updateMyProfile(req.user.username, req.body);
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const resetTotp = async (req, res, next) => {
  try {
    const result = await userService.resetTotp(req.params.userId, req.user.username, req.body);
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

const adminUpdateUser = async (req, res, next) => {
  try {
    const result = await userService.adminUpdateUser(
      req.params.userId,
      req.body,
      req.user.username,
    );
    res.status(200).json({ message: result.message, data: result.data }).end();
  } catch (error) {
    next(error);
  }
};

export default { search, getById, verify, activate, deactivate, getMyProfile, updateMyPassword, updateMyAccount, updateMyProfile, resetTotp, adminUpdateUser };
