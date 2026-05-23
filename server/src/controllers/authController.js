import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import User from "../models/User.js";

import {
    generateAccessToken,
    generateRefreshToken
} from "../utils/generateTokens.js";


// SIGNUP
export const signup = async (req, res) => {
    try {

        const { username, email, password } = req.body;

        // check existing user
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // create user
        const user = await User.create({
            username,
            email,
            password: hashedPassword
        });

        // generate tokens
        const accessToken = generateAccessToken(user._id);

        const refreshToken = generateRefreshToken(user._id);

        // save refresh token
        user.refreshToken = refreshToken;

        await user.save();

        // send cookies
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: false,
            sameSite: "Lax"
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "Lax"
        });

        res.status(201).json({
            success: true,
            message: "Signup successful",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



// LOGIN
export const login = async (req, res) => {
    try {

        const { email, password } = req.body;

        // find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // compare password
        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // generate tokens
        const accessToken = generateAccessToken(user._id);

        const refreshToken = generateRefreshToken(user._id);

        // save refresh token
        user.refreshToken = refreshToken;

        await user.save();

        // cookies
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: false,
            sameSite: "Lax"
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "Lax"
        });

        res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



// LOGOUT
export const logout = async (req, res) => {
    try {

        const user = await User.findById(req.user.id);

        user.refreshToken = "";

        await user.save();

        res.clearCookie("accessToken");

        res.clearCookie("refreshToken");

        res.status(200).json({
            success: true,
            message: "Logged out"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



// GET CURRENT USER
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};