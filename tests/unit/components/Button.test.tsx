import React from "react";
import { render, screen, fireEvent } from "../../../fixtures/utils/testUtils";
import { Button } from "@/components/common/Button";

describe("Button Component", () => {
  const defaultProps = {
    children: "Click me",
    onClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    test("renders button with text content", () => {
      render(<Button {...defaultProps} />);
      expect(
        screen.getByRole("button", { name: "Click me" })
      ).toBeInTheDocument();
    });

    test("renders button with custom className", () => {
      render(<Button {...defaultProps} className="custom-class" />);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("custom-class");
    });

    test("renders button with different variants", () => {
      const { rerender } = render(
        <Button {...defaultProps} variant="default" />
      );
      expect(screen.getByRole("button")).toHaveClass("bg-primary");

      rerender(<Button {...defaultProps} variant="destructive" />);
      expect(screen.getByRole("button")).toHaveClass("bg-destructive");

      rerender(<Button {...defaultProps} variant="outline" />);
      expect(screen.getByRole("button")).toHaveClass("border border-input");
    });

    test("renders button with different sizes", () => {
      const { rerender } = render(<Button {...defaultProps} size="default" />);
      expect(screen.getByRole("button")).toHaveClass("h-10 px-4 py-2");

      rerender(<Button {...defaultProps} size="sm" />);
      expect(screen.getByRole("button")).toHaveClass("h-9 px-3");

      rerender(<Button {...defaultProps} size="lg" />);
      expect(screen.getByRole("button")).toHaveClass("h-11 px-8");
    });
  });

  describe("Interactions", () => {
    test("calls onClick when clicked", () => {
      const onClick = jest.fn();
      render(<Button {...defaultProps} onClick={onClick} />);

      fireEvent.click(screen.getByRole("button"));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    test("does not call onClick when disabled", () => {
      const onClick = jest.fn();
      render(<Button {...defaultProps} onClick={onClick} disabled />);

      fireEvent.click(screen.getByRole("button"));
      expect(onClick).not.toHaveBeenCalled();
    });

    test("applies disabled styles when disabled", () => {
      render(<Button {...defaultProps} disabled />);
      const button = screen.getByRole("button");

      expect(button).toBeDisabled();
      expect(button).toHaveClass("opacity-50");
    });
  });

  describe("Accessibility", () => {
    test("has proper button role", () => {
      render(<Button {...defaultProps} />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    test("supports aria-label", () => {
      render(<Button {...defaultProps} aria-label="Submit form" />);
      expect(screen.getByLabelText("Submit form")).toBeInTheDocument();
    });

    test("supports aria-describedby", () => {
      render(
        <div>
          <Button {...defaultProps} aria-describedby="button-help" />
          <div id="button-help">This button submits the form</div>
        </div>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-describedby", "button-help");
    });

    test("supports keyboard navigation", () => {
      render(<Button {...defaultProps} />);
      const button = screen.getByRole("button");

      button.focus();
      expect(button).toHaveFocus();

      fireEvent.keyDown(button, { key: "Enter" });
      expect(defaultProps.onClick).toHaveBeenCalled();

      fireEvent.keyDown(button, { key: " " });
      expect(defaultProps.onClick).toHaveBeenCalledTimes(2);
    });
  });

  describe("Props handling", () => {
    test("forwards ref correctly", () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button {...defaultProps} ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    test("applies custom type attribute", () => {
      render(<Button {...defaultProps} type="submit" />);
      expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
    });

    test("applies custom form attribute", () => {
      render(<Button {...defaultProps} form="test-form" />);
      expect(screen.getByRole("button")).toHaveAttribute("form", "test-form");
    });

    test("handles loading state", () => {
      render(<Button {...defaultProps} loading />);
      const button = screen.getByRole("button");

      expect(button).toBeDisabled();
      expect(button).toHaveClass("opacity-50");
    });
  });

  describe("Edge cases", () => {
    test("renders without children", () => {
      render(<Button onClick={jest.fn()} />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    test("handles null onClick gracefully", () => {
      render(<Button onClick={null as any} />);
      const button = screen.getByRole("button");

      expect(() => fireEvent.click(button)).not.toThrow();
    });

    test("handles undefined className gracefully", () => {
      render(<Button {...defaultProps} className={undefined} />);
      const button = screen.getByRole("button");

      expect(button).toBeInTheDocument();
      expect(button.className).toBeTruthy();
    });
  });

  describe("Performance", () => {
    test("renders quickly", () => {
      const start = performance.now();
      render(<Button {...defaultProps} />);
      const end = performance.now();

      expect(end - start).toBeLessThan(100); // Should render in less than 100ms
    });

    test("handles rapid clicks efficiently", () => {
      const onClick = jest.fn();
      render(<Button {...defaultProps} onClick={onClick} />);
      const button = screen.getByRole("button");

      const start = performance.now();
      for (let i = 0; i < 10; i++) {
        fireEvent.click(button);
      }
      const end = performance.now();

      expect(onClick).toHaveBeenCalledTimes(10);
      expect(end - start).toBeLessThan(50); // Should handle 10 clicks in less than 50ms
    });
  });
});
