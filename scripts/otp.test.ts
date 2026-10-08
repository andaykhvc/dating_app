import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isCompleteOtp,
  isEmailNotConfirmed,
  normalizeOtp,
  otpErrorMessage,
  secondsLeft,
} from "../src/lib/otp.ts";

test("a pasted or autofilled code is reduced to its digits", () => {
  assert.equal(normalizeOtp("123456"), "123456");
  assert.equal(normalizeOtp("123 456"), "123456");
  assert.equal(normalizeOtp("123-456"), "123456");
  assert.equal(normalizeOtp(" 12a3b4 5 6 "), "123456");
  assert.equal(normalizeOtp("1234567890"), "123456");
  assert.equal(normalizeOtp("abc"), "");
});

test("only six digits count as a complete code", () => {
  assert.equal(isCompleteOtp("123456"), true);
  assert.equal(isCompleteOtp("12345"), false);
  assert.equal(isCompleteOtp("1234567"), false);
  assert.equal(isCompleteOtp("12345a"), false);
  assert.equal(isCompleteOtp(""), false);
});

test("resend countdown rounds up and never goes negative", () => {
  assert.equal(secondsLeft(61_000, 1_000), 60);
  assert.equal(secondsLeft(1_500, 1_000), 1);
  assert.equal(secondsLeft(1_000, 1_000), 0);
  assert.equal(secondsLeft(500, 1_000), 0);
});

test("error messages are friendly", () => {
  assert.match(otpErrorMessage("Token has expired or is invalid"), /wrong or has expired/);
  assert.match(otpErrorMessage("email rate limit exceeded"), /Too many tries/);
  assert.match(otpErrorMessage("For security purposes, you can only request this after 52 seconds."), /Too many tries/);
  assert.match(otpErrorMessage("Failed to fetch"), /Could not reach the server/);
  assert.match(otpErrorMessage("Load failed"), /Could not reach the server/);
  assert.equal(otpErrorMessage("Something odd"), "Something odd");
  assert.equal(isEmailNotConfirmed("Email not confirmed"), true);
  assert.equal(isEmailNotConfirmed("Invalid login credentials"), false);
});
