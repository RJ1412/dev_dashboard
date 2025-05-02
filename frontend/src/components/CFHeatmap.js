import React, { useEffect, useState } from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { subDays, format } from "date-fns";
import "./CFHeatmap.css"; // Create this CSS file for styling

export default function CFHeatmap({ userId }) {
  const [handle, setHandle] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Step 1: Fetch Codeforces handle from your backend
  useEffect(() => {
    const getHandle = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/user/${userId}/coding-sites`);
        const json = await res.json();
        if (json.handle) {
          setHandle(json.handle);
        }
      } catch (err) {
        console.error("Error fetching Codeforces handle:", err);
      }
    };
    getHandle();
  }, [userId]);

  // Step 2: Fetch Codeforces submissions
  useEffect(() => {
    if (!handle) return;
    const fetchSubmissions = async () => {
      try {
        const res = await fetch(`https://codeforces.com/api/user.status?handle=${handle}`);
        const json = await res.json();

        const oneYearAgo = subDays(new Date(), 365);
        const counts = {};

        json.result.forEach((submission) => {
          const date = new Date(submission.creationTimeSeconds * 1000);
          if (date < oneYearAgo) return;
          const day = format(date, "yyyy-MM-dd");
          counts[day] = (counts[day] || 0) + 1;
        });

        const heatmapData = Object.entries(counts).map(([date, count]) => ({
          date,
          count,
        }));

        setData(heatmapData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching Codeforces data:", err);
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, [handle]);

  if (loading) return <p>Loading Codeforces activity...</p>;

  return (
    <div className="heatmap-container">
      <h2>Codeforces Heatmap (Past Year)</h2>
      <CalendarHeatmap
        startDate={subDays(new Date(), 365)}
        endDate={new Date()}
        values={data}
        classForValue={(value) => {
          if (!value) return "color-empty";
          if (value.count >= 10) return "color-github-4";
          if (value.count >= 5) return "color-github-3";
          if (value.count >= 2) return "color-github-2";
          return "color-github-1";
        }}
        showWeekdayLabels={true}
      />
    </div>
  );
}
