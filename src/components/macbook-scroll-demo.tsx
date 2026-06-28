import React from "react";
import { MacbookScroll } from "@/components/ui/macbook-scroll";

export default function MacbookScrollDemo() {
  return (
    <div className="w-full overflow-hidden bg-background">
      <MacbookScroll
        title={
          <span>
            Recruiting intelligence, beautifully built. <br /> See your outreach at a glance.
          </span>
        }
        src="/dashboard-screen.png"
        showGradient={false}
      />
    </div>
  );
}
