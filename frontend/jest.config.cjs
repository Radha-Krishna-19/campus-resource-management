module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "<rootDir>/test/__mocks__/styleMock.js",
    "\\.(png|jpg|jpeg|gif|svg)$": "<rootDir>/test/__mocks__/fileMock.js"
  },
  testMatch: ["**/test/**/*.test.[jt]s?(x)"],
};