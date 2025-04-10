"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var test_1 = require("@playwright/test");
var axios_1 = require("axios");
var dotenv = require("dotenv");
// Load environment variables from .env file
dotenv.config();
// Configuration settings
var EXCHANGE_RATE_API_URL = 'https://open.er-api.com/v6/latest/AED';
var JENKINS_URL = process.env.JENKINS_URL || 'http://your-jenkins-instance.com';
var JENKINS_JOB_NAME = process.env.JENKINS_JOB_NAME || 'send-exchange-rate-email';
var JENKINS_API_TOKEN = process.env.JENKINS_API_TOKEN || '';
var JENKINS_USERNAME = process.env.JENKINS_USERNAME || '';
var RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL || 'user@example.com';
var THRESHOLD_RATE = process.env.THRESHOLD_RATE ? parseFloat(process.env.THRESHOLD_RATE) : 23.5; // Alert if rate crosses this threshold
function getExchangeRate() {
    return __awaiter(this, void 0, void 0, function () {
        var response, rate, lastUpdate, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, axios_1.default.get(EXCHANGE_RATE_API_URL)];
                case 1:
                    response = _a.sent();
                    if (response.data && response.data.rates && response.data.rates.INR) {
                        rate = response.data.rates.INR;
                        lastUpdate = response.data.time_last_update_utc;
                        console.log("Current AED to INR exchange rate: ".concat(rate));
                        console.log("Last updated: ".concat(lastUpdate));
                        return [2 /*return*/, { rate: rate, lastUpdate: lastUpdate }];
                    }
                    else {
                        throw new Error('Failed to parse exchange rate data');
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error('Error fetching exchange rate:', error_1);
                    throw error_1;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function triggerJenkinsJob(rate, lastUpdate) {
    return __awaiter(this, void 0, void 0, function () {
        var browser, context, page, jobUrl, subject, error_2, params, auth, apiError_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_1.chromium.launch({ headless: true })];
                case 1:
                    browser = _a.sent();
                    return [4 /*yield*/, browser.newContext()];
                case 2:
                    context = _a.sent();
                    return [4 /*yield*/, context.newPage()];
                case 3:
                    page = _a.sent();
                    _a.label = 4;
                case 4:
                    _a.trys.push([4, 18, 23, 25]);
                    console.log("Accessing Jenkins at ".concat(JENKINS_URL, "..."));
                    // Navigate to Jenkins
                    return [4 /*yield*/, page.goto(JENKINS_URL)];
                case 5:
                    // Navigate to Jenkins
                    _a.sent();
                    return [4 /*yield*/, page.locator('input#j_username').isVisible()];
                case 6:
                    if (!_a.sent()) return [3 /*break*/, 10];
                    console.log('Logging into Jenkins...');
                    return [4 /*yield*/, page.fill('input#j_username', JENKINS_USERNAME)];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, page.fill('input[name="j_password"]', JENKINS_API_TOKEN)];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, page.click('input[name="Submit"]')];
                case 9:
                    _a.sent();
                    _a.label = 10;
                case 10:
                    jobUrl = "".concat(JENKINS_URL, "/job/").concat(JENKINS_JOB_NAME);
                    return [4 /*yield*/, page.goto(jobUrl)];
                case 11:
                    _a.sent();
                    // Click "Build with Parameters" option
                    return [4 /*yield*/, page.click('span:has-text("Build with Parameters")')];
                case 12:
                    // Click "Build with Parameters" option
                    _a.sent();
                    // Fill in the parameters
                    return [4 /*yield*/, page.fill('input[name="EXCHANGE_RATE"]', rate.toString())];
                case 13:
                    // Fill in the parameters
                    _a.sent();
                    return [4 /*yield*/, page.fill('input[name="LAST_UPDATE"]', lastUpdate)];
                case 14:
                    _a.sent();
                    return [4 /*yield*/, page.fill('input[name="RECIPIENT_EMAIL"]', RECIPIENT_EMAIL)];
                case 15:
                    _a.sent();
                    subject = rate > THRESHOLD_RATE
                        ? "ALERT: AED to INR rate above threshold (".concat(rate, ")")
                        : "Daily Exchange Rate: AED to INR (".concat(rate, ")");
                    return [4 /*yield*/, page.fill('input[name="EMAIL_SUBJECT"]', subject)];
                case 16:
                    _a.sent();
                    // Build the job
                    return [4 /*yield*/, page.click('button:has-text("Build")')];
                case 17:
                    // Build the job
                    _a.sent();
                    console.log("Jenkins job \"".concat(JENKINS_JOB_NAME, "\" triggered successfully"));
                    return [3 /*break*/, 25];
                case 18:
                    error_2 = _a.sent();
                    console.error('Error triggering Jenkins job:', error_2);
                    _a.label = 19;
                case 19:
                    _a.trys.push([19, 21, , 22]);
                    console.log('Attempting to use Jenkins REST API instead...');
                    params = new URLSearchParams();
                    params.append('EXCHANGE_RATE', rate.toString());
                    params.append('LAST_UPDATE', lastUpdate);
                    params.append('RECIPIENT_EMAIL', RECIPIENT_EMAIL);
                    params.append('EMAIL_SUBJECT', rate > THRESHOLD_RATE
                        ? "ALERT: AED to INR rate above threshold (".concat(rate, ")")
                        : "Daily Exchange Rate: AED to INR (".concat(rate, ")"));
                    auth = Buffer.from("".concat(JENKINS_USERNAME, ":").concat(JENKINS_API_TOKEN)).toString('base64');
                    return [4 /*yield*/, axios_1.default.post("".concat(JENKINS_URL, "/job/").concat(JENKINS_JOB_NAME, "/buildWithParameters"), params, {
                            headers: {
                                'Authorization': "Basic ".concat(auth),
                                'Content-Type': 'application/x-www-form-urlencoded'
                            }
                        })];
                case 20:
                    _a.sent();
                    console.log('Jenkins job triggered via API successfully');
                    return [3 /*break*/, 22];
                case 21:
                    apiError_1 = _a.sent();
                    console.error('Error with Jenkins API method:', apiError_1);
                    throw new Error('Failed to trigger Jenkins job through UI and API');
                case 22: return [3 /*break*/, 25];
                case 23: return [4 /*yield*/, browser.close()];
                case 24:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 25: return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, rate, lastUpdate, error_3;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, getExchangeRate()];
                case 1:
                    _a = _b.sent(), rate = _a.rate, lastUpdate = _a.lastUpdate;
                    // Trigger Jenkins job to send email
                    return [4 /*yield*/, triggerJenkinsJob(rate, lastUpdate)];
                case 2:
                    // Trigger Jenkins job to send email
                    _b.sent();
                    console.log('Process completed successfully!');
                    return [3 /*break*/, 4];
                case 3:
                    error_3 = _b.sent();
                    console.error('Process failed:', error_3);
                    process.exit(1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Execute the main function
main();
