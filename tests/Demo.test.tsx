import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Demo } from "../demo/Demo";

describe("chat composer demo", () => {
  it("inserts emoji at the cursor and sends an icon attachment", async () => {
    const user = userEvent.setup();
    render(<Demo />);
    const message = screen.getByRole("textbox", { name: "Message" });

    await user.type(message, "Hello world");
    (message as HTMLTextAreaElement).setSelectionRange(5, 5);
    await user.type(screen.getByRole("textbox", { name: "Filter…" }), "rocket");
    await user.click(screen.getByRole("button", { name: "rocket" }));

    expect(message).toHaveValue("Hello🚀 world");
    expect(screen.queryByLabelText("Asset picker")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Toggle asset picker" }),
    );
    await user.click(screen.getByRole("tab", { name: "Icons" }));
    await user.type(screen.getByRole("textbox", { name: "Filter…" }), "agent");
    await user.click(screen.getByRole("button", { name: "Agent" }));

    expect(screen.getByLabelText("Message attachment")).toHaveTextContent(
      "Agent",
    );
    expect(screen.queryByLabelText("Asset picker")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(screen.getByText("Hello🚀 world")).toBeVisible();
    expect(
      screen.queryByLabelText("Message attachment"),
    ).not.toBeInTheDocument();
  });

  it("uses the same picker for an avatar and closes after selection", async () => {
    const user = userEvent.setup();
    render(<Demo />);

    await user.click(
      screen.getByRole("button", { name: "Avatar & page icon" }),
    );
    await user.type(screen.getByRole("textbox", { name: "Filter…" }), "rocket");
    await user.click(screen.getByRole("button", { name: "rocket" }));

    expect(screen.queryByLabelText("Asset picker")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Change profile identity" }),
    ).toHaveTextContent("🚀");
  });
});
