import Script from "next/script";

export const metadata = {
  title: "Portal Hotéis — HUB Transfer",
  description: "Sistema de gestão de transfers para hotéis parceiros",
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Script
        src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBe4UwnVYRP5KAUOtHg3diD6kPTif3VN30&libraries=places"
        strategy="lazyOnload"
      />
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.19/js/intlTelInput.min.js"
        strategy="lazyOnload"
      />
      {children}
    </>
  );
}
