import React from "react";
import { Boxes } from "lucide-react";

interface BrandLogoProps {
  showTitle?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ showTitle = true }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div className="brand-badge" aria-label="StockSense Logo">
        <Boxes size={22} strokeWidth={2.2} />
      </div>
      {showTitle && (
        <span className="brand-title">
          StockSense
        </span>
      )}
    </div>
  );
};
