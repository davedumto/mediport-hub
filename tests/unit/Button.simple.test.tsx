import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Button from "@/components/common/Button";

describe("Button Component - Simple Test", () => {
  const defaultProps = {
    btnTitle: "Click me",
    onClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders button with text content", () => {
    render(<Button {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: "Click me" })
    ).toBeInTheDocument();
  });

  test("calls onClick when clicked", () => {
    const onClick = jest.fn();
    render(<Button {...defaultProps} onClick={onClick} />);

    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test("applies disabled styles when disabled", () => {
    render(<Button {...defaultProps} disabled />);
    const button = screen.getByRole("button");

    expect(button).toBeDisabled();
    expect(button).toHaveClass("opacity-50");
  });

  test("handles loading state", () => {
    render(<Button {...defaultProps} loading />);
    const button = screen.getByRole("button");

    expect(button).toBeDisabled();
    expect(button).toHaveClass("opacity-50");
  });
});
