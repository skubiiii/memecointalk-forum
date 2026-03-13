"use client";

interface QuoteButtonProps {
  postAuthor: string;
  postContent: string;
  threadId: string;
}

export default function QuoteButton({
  postAuthor,
  postContent,
}: QuoteButtonProps) {
  const handleQuote = () => {
    const quoteText = `[quote=${postAuthor}]${postContent}[/quote]`;

    // Dispatch custom event for the BBCodeEditor to pick up
    window.dispatchEvent(
      new CustomEvent("bbcode-insert-quote", {
        detail: { text: quoteText },
      })
    );

    // Scroll to the reply form
    const replyForm = document.getElementById("reply-form");
    if (replyForm) {
      replyForm.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <button type="button" className="quote-btn" onClick={handleQuote}>
      Quote
    </button>
  );
}
