import React from "react";
import { render, screen } from "@testing-library/react";
import { AuthProvider } from "../src/context/AuthContext";
import Header from "../src/components/Header";

import { BrowserRouter } from "react-router-dom";
import api from "../src/services/api";

vi.mock("../src/services/api", () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }
}));
api.get.mockResolvedValue({ data: {} });

// Simple helper to render Header with a mocked user via context
const renderWithUser = (user) => {
  const Wrapper = ({ children }) => (
    <BrowserRouter>
      <AuthProvider>
        {React.cloneElement(children, { __testUser: user })}
      </AuthProvider>
    </BrowserRouter>
  );

  // We can’t easily override context value without refactoring, so for now
  // just verify component renders the static parts correctly.
  return render(<Header />, { wrapper: Wrapper });
};

describe("Header component", () => {
  it("renders portal title", () => {
    render(<Header />, { wrapper: ({ children }) => <BrowserRouter><AuthProvider>{children}</AuthProvider></BrowserRouter> });
    expect(screen.getByText(/AMRITA PORTAL/i)).toBeInTheDocument();
  });
});