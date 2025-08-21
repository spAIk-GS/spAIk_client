import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./ResultPage.scss";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceArea, ReferenceDot, Legend,
  LineChart, Line, LabelList, ReferenceLine
} from "recharts";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ⬇ 시간(mm:ss) 포맷
const toMMSS = (sec) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

// ⬇ 평균/표준편차로 “권장 범위(밴드)” 대략 추정
const stats = (arr) => {
  if (!arr.length) return { mean: 0, std: 0 };
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const std = Math.sqrt(arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length);
  return { mean, std };
};

const EMOJI_MAP = {
  "좋음": { emoji: "😊", colorClass: "good" },
  "보통": { emoji: "🙂", colorClass: "okay" },
  "미흡": { emoji: "😖", colorClass: "bad" },
};

const ResultPage = () => {
  const location = useLocation();
  // location.state.result에 전체 JSON 데이터가 들어있음
  const { presentationId } = useParams();

  // 👇 2. 상태 관리 추가 (기존 resultData를 상태로 변경)
  const [resultData, setResultData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  console.log(resultData);

  // 👇 3. 데이터 로딩 로직으로 useEffect 수정
  useEffect(() => {
    const loadResultData = async () => {
        setIsLoading(true);
        setError(null);

        // 우선, 다른 페이지에서 넘겨준 데이터가 있는지 확인 (가장 빠른 방법)
        if (location.state?.result) {
            console.log("데이터를 location.state에서 찾았습니다.");
            setResultData(location.state.result);
            setIsLoading(false);
            return;
        }

        // 없다면 (새로고침, 직접 접속 등), URL의 ID로 API 호출
        console.log(`location.state에 데이터가 없어, ID(${presentationId})로 API를 호출합니다.`);
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) throw new Error("로그인이 필요합니다.");

            const response = await fetch(`http://localhost:8080/result/${presentationId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('결과를 불러오는 데 실패했습니다.');
            }
            const data = await response.json();
            setResultData(data);

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    loadResultData();
  }, [presentationId, location.state]); // ID가 바뀔 때마다 다시 데이터를 불러옴

  if (isLoading) {
    return <div className="container"><h1>로딩 중...</h1></div>;
  }
  if (error) {
    return <div className="container"><h1>오류: {error}</h1></div>;
  }
  if (!resultData) {
    return <div className="container"><h1>결과 데이터가 없습니다.</h1></div>;
  }

  const getEmotion = (val) => (val || "데이터 없음");

  const metrics = [
    {
      key: "pitch",
      label: "음성 높낮이",
      value: getEmotion(resultData.details?.audio?.results?.pitch?.emotion),
    },
    {
      key: "gaze",
      label: "시선처리",
      value: getEmotion(resultData.details?.video?.results?.gaze?.emotion),
    },
    {
      key: "movement",
      label: "몸의 움직임",
      value: getEmotion(resultData.details?.video?.results?.movement?.emotion),
    },
    {
      key: "speed",
      label: "말하기 속도",
      value: getEmotion(resultData.details?.audio?.results?.speed?.emotion),
    },
    {
      key: "volume",
      label: "음량 크기",
      value: getEmotion(resultData.details?.audio?.results?.volume?.emotion),
    },
  ];

  const getStyle = (v) => EMOJI_MAP[v] || { emoji: "🫥", colorClass: "none" };

  // 정상적으로 데이터를 받은 경우
  return (
    <div className="result-page">
      <Header />
      <main>
        <div className="container">
          <h1>AI 분석 결과</h1>



          <h3>요약</h3>
          <section className="metric-strip">
            {metrics.map(({ key, label, value }) => {
              const { emoji, colorClass } = getStyle(value);
              return (
                <div key={key} className="metric-card">
                  <div className="metric-label">{label}</div>
                  <div className="metric-emoji" aria-hidden>{emoji}</div>
                  <div className={`metric-value ${colorClass}`}>{value}</div>
                </div>
              );
            })}
          </section>




          <section style={{ marginTop: 24 }}>
            <h3 style={{ margin: "8px 0 12px" }}>피치(음성 높낮이) 추이</h3>

            {(() => {
              const segs = resultData?.details?.audio?.results?.pitch?.segments || [];
              if (!segs.length) return <div>그래프 데이터가 없습니다.</div>;

              // 구간 중간 시각 기준으로 한 점씩 생성
              const data = segs.map((s) => {
                const mid = (s.start_time_sec + s.end_time_sec) / 2;
                return {
                  time: toMMSS(mid),
                  value: Math.round(s.value), // Hz로 가정
                };
              });

              const ys = data.map(d => d.value);
              const minY = Math.min(...ys), maxY = Math.max(...ys);
              const { mean, std } = stats(ys);

              // 권장 범위(대략): 평균 ± (표준편차의 0.5배)
              const bandLow = Math.round(mean - std * 0.5);
              const bandHigh = Math.round(mean + std * 0.5);

              // 가장 높은 지점(레이블용)
              const peak = data[ys.indexOf(maxY)];

              // 여백 주어 y축 범위 살짝 넓히기
              const pad = Math.max(10, Math.round((maxY - minY) * 0.1));
              const yDomain = [minY - pad, maxY + pad];

              return (
                <div style={{
                  height: 320, background: "#fff", border: "1px solid #e5e7eb",
                  borderRadius: 14, padding: 12
                }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={yDomain} tickFormatter={(v) => `${v}`} />
                      <Tooltip formatter={(v) => [`${v} Hz`, "피치"]} />
                      <Legend />
                      {/* 연한 면적 + 선 */}
                      <Area
                        type="monotone"
                        dataKey="value"
                        name="피치(Hz)"
                        stroke="#22c55e"
                        fill="#22c55e"
                        fillOpacity={0.15}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                      {/* 권장 범위(밴드) — 이미지의 주황색 영역 느낌 */}
                      <ReferenceArea
                        y1={bandLow}
                        y2={bandHigh}
                        strokeOpacity={0}
                        fill="#f97316"
                        fillOpacity={0.2}
                        label={{
                          value: "평균 범위",
                          position: "insideTop",
                          fill: "#b45309",
                          fontSize: 20,
                          fontWeight: 800,
                          opacity: 0.6,
                        }}
                      />
                      {/* 최대값 콕 집어 표시 (이미지의 말풍선 느낌) */}
                      {peak && (
                        <ReferenceDot
                          x={peak.time}
                          y={peak.value}
                          r={5}
                          fill="#ef4444"
                          stroke="none"
                          label={{
                            value: `🔺 ${peak.value} Hz`,
                            position: "top",
                            fill: "#111827",
                            fontWeight: 800,
                            backgroundColor: "#fff",
                          }}
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              );
            })()}
          </section>




          <section style={{ marginTop: 24 }}>
            <h3 style={{ margin: "8px 0 12px" }}>말하기 속도 추이</h3>

            {(() => {
              const segs = resultData?.details?.audio?.results?.speed?.segments || [];
              if (!segs.length) return <div>그래프 데이터가 없습니다.</div>;

              const data = segs.map((s) => {
                const mid = (s.start_time_sec + s.end_time_sec) / 2;
                const v = Math.round(s.value);
                return { time: toMMSS(mid), value: v, label: v };
              });

              const ys = data.map((d) => d.value);
              const minY = Math.min(...ys);
              const maxY = Math.max(...ys);
              const pad = Math.max(10, Math.round((maxY - minY) * 0.15));
              const yDomain = [Math.max(0, minY - pad), maxY + pad];

              const SPEED_BAND_LOW = 110;
              const SPEED_BAND_HIGH = 160;

              return (
                <div
                  style={{
                    height: 280,
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: 12,
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={yDomain} />
                      <Tooltip formatter={(v) => [`${v}`, "말하기 속도"]} />

                      {/* 🟧 권장 범위 밴드 */}
                      <ReferenceArea
                        y1={SPEED_BAND_LOW}
                        y2={SPEED_BAND_HIGH}
                        strokeOpacity={0}
                        fill="#f97316"
                        fillOpacity={0.22}
                        label={{
                          value: "권장 속도 범위",
                          position: "insideTopRight",
                          fill: "#b45309",
                          fontSize: 16,
                          fontWeight: 800,
                          opacity: 0.75,
                        }}
                      />

                      <Line
                        type="monotone"
                        dataKey="value"
                        name="말하기 속도"
                        stroke="#0f766e"
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      >
                        <LabelList dataKey="label" position="top" />
                      </Line>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              );
            })()}
          </section>



          <section style={{ marginTop: 24 }}>
            <h3 style={{ margin: "8px 0 12px" }}>시선 처리(집중도) 추이</h3>

            {(() => {
              const segs =
                resultData?.details?.audio?.results?.gaze?.segments ??
                resultData?.details?.video?.results?.gaze?.segments ??
                [];

              if (!segs.length) return <div>그래프 데이터가 없습니다.</div>;

              // 구간 중간 시점 기준, focus_level(0~1)을 0~100%로 변환
              const data = segs.map((s) => {
                const mid = (s.start_time_sec + s.end_time_sec) / 2;
                const pct = Math.round((s.focus_level ?? 0) * 100);
                return { time: toMMSS(mid), value: pct, label: pct };
              });

              // 권장 집중 범위(퍼센트). 필요하면 조정!
              const BAND_LOW = 82;
              const BAND_HIGH = 100;

              return (
                <div
                  style={{
                    height: 280,
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: 12,
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <Tooltip formatter={(v) => [`${v}%`, "집중도"]} />

                      {/* 권장 집중 범위 밴드(주황색) */}
                      <ReferenceArea
                        y1={BAND_LOW}
                        y2={BAND_HIGH}
                        strokeOpacity={0}
                        fill="#f97316"
                        fillOpacity={0.22}
                        label={{
                          value: "권장 집중 범위 (82% ~ )",
                          position: "insideTopRight",
                          fill: "#b45309",
                          fontSize: 16,
                          fontWeight: 800,
                          opacity: 0.75,
                        }}
                      />

                      <Line
                        type="monotone"
                        dataKey="value"
                        name="집중도(%)"
                        stroke="#0ea5e9"
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      >
                        {/* 점 위에 값 표기 */}
                        <LabelList dataKey="label" position="top" />
                      </Line>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              );
            })()}
          </section>




          <section style={{ marginTop: 24 }}>
            <h3 style={{ margin: "8px 0 12px" }}>몸의 움직임 추이</h3>

            {(() => {
              const segs = resultData?.details?.video?.results?.movement?.segments || [];
              if (!segs.length) return <div>그래프 데이터가 없습니다.</div>;

              // 구간 중간 시점 기준, movement_percent(0~1) -> 0~100% 변환
              const data = segs.map((s) => {
                const mid = (s.start_time_sec + s.end_time_sec) / 2;
                const pct = Math.round((s.movement_percent ?? 0) * 100);
                return { time: toMMSS(mid), value: pct, label: pct };
              });

              // 권장 움직임 범위(원하면 숫자만 바꿔)
              const MOV_BAND_LOW = 28;  // 너무 정적인 구간 방지
              const MOV_BAND_HIGH = 75; // 과도한 움직임 방지

              return (
                <div
                  style={{
                    height: 280,
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: 12,
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <Tooltip formatter={(v) => [`${v}%`, "움직임 비율"]} />

                      {/* 권장 범위 밴드(주황색) */}
                      <ReferenceArea
                        y1={MOV_BAND_LOW}
                        y2={MOV_BAND_HIGH}
                        strokeOpacity={0}
                        fill="#f97316"
                        fillOpacity={0.22}
                        label={{
                          value: "권장 움직임 범위",
                          position: "insideTopRight",
                          fill: "#b45309",
                          fontSize: 16,
                          fontWeight: 800,
                          opacity: 0.75,
                        }}
                      />

                      <Line
                        type="monotone"
                        dataKey="value"
                        name="움직임(%)"
                        stroke="#6366f1"
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      >
                        <LabelList dataKey="label" position="top" />
                      </Line>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              );
            })()}
          </section>




          <section style={{ marginTop: 24 }}>
            <h3 style={{ margin: "8px 0 12px" }}>평균 지표</h3>

            {(() => {
              // 값 꺼내기 (존재 안 하면 undefined)
              const mv = resultData?.details?.video?.results?.movement?.movement_percent; // 이미 %
              const gz = resultData?.details?.video?.results?.gaze?.focus_level;         // 이미 %
              const sp = resultData?.details?.audio?.results?.speed?.value;              // 숫자
              const pt = resultData?.details?.audio?.results?.pitch?.value;              // Hz
              const db = resultData?.details?.audio?.results?.volume?.decibels;          // dB

              // 포맷터(간단)
              const toPercent = (v, digits = 0) => {
                if (typeof v !== "number" || !isFinite(v)) return "–";
                const raw = v <= 1 ? v * 100 : v;          // 0~1 스케일이면 100배
                const clamped = Math.max(0, Math.min(100, raw)); // 0~100 범위로 클램프
                return `${clamped.toFixed(digits)}%`;
              };
              const fmtInt = (v) =>
                typeof v === "number" && isFinite(v) ? `${Math.round(v)}` : "–";
              const fmtHz = (v) =>
                typeof v === "number" && isFinite(v) ? `${Math.round(v)} Hz` : "–";
              const fmtDb = (v) =>
                typeof v === "number" && isFinite(v) ? `${v.toFixed(1)} dB` : "–";

              const box = {
                border: "1px solid #e5e7eb",
                borderRadius: 14,
                padding: "14px 12px 16px",
                textAlign: "center",
                background: "#fff",
              };
              const label = { fontWeight: 800, marginBottom: 6, letterSpacing: ".2px" };
              const value = { fontSize: 26, fontWeight: 800, letterSpacing: ".3px" };

              return (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: 12,
                  }}
                >
                  <div style={box}>
                    <div style={label}>몸의 움직임</div>
                    <div style={{ ...value, color: "#6366f1" }}>{toPercent(mv)}</div>
                  </div>

                  <div style={box}>
                    <div style={label}>시선 집중도</div>
                    <div style={{ ...value, color: "#0ea5e9" }}>{toPercent(gz)}</div>
                  </div>

                  <div style={box}>
                    <div style={label}>말하기 속도</div>
                    {/* 필요하면 단위 붙이고 싶을 때: `${fmtInt(sp)} WPM` */}
                    <div style={{ ...value, color: "#0f766e" }}>{fmtInt(sp)}</div>
                  </div>

                  <div style={box}>
                    <div style={label}>음성 높낮이</div>
                    <div style={{ ...value, color: "#22c55e" }}>{fmtHz(pt)}</div>
                  </div>

                  <div style={box}>
                    <div style={label}>음량</div>
                    <div style={{ ...value, color: "#b45309" }}>{fmtDb(db)}</div>
                  </div>
                </div>
              );
            })()}
          </section>





          <section style={{ marginTop: 24 }}>
            <h3 style={{ margin: "8px 0 12px" }}>말 더듬은 횟수</h3>

            {(() => {
              const raw = resultData?.details?.audio?.results?.stutter?.stutter_count;
              const isNum = typeof raw === "number" && isFinite(raw);
              const count = isNum ? Math.max(0, Math.round(raw)) : null; // 음수/소수 방어

              const box = {
                border: "1px solid #e5e7eb",
                borderRadius: 14,
                padding: "14px 12px 16px",
                textAlign: "center",
                background: "#fff",
              };
              const label = { fontWeight: 800, marginBottom: 6, letterSpacing: ".2px" };
              const value = { fontSize: 32, fontWeight: 900, letterSpacing: ".3px" };

              // 간단한 색상 규칙(원하면 수정하세요)
              const color =
                count == null ? "#9aa0a6" :
                count === 0   ? "#16a34a" :       // 0회: 초록
                count <= 3    ? "#f59e0b" :       // 1~3회: 주의
                                "#dc2626";        // 4회+: 경고

              return (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: 12,
                  }}
                >
                  <div style={box}>
                    <div style={label}>말 더듬은 횟수</div>
                    <div style={{ ...value, color }}>
                      {count == null ? "–" : `${count}회`}
                    </div>
                  </div>
                </div>
              );
            })()}
          </section>



          <section style={{ marginTop: 24 }}>
            <h3 style={{ margin: "8px 0 12px" }}>말 더듬 구간 TimeStamp</h3>

            {(() => {
              const details = resultData?.details?.audio?.results?.stutter?.stutter_details || [];

              // "71.20s - 71.42s" 같은 문자열에서 숫자만 뽑아 {start,end} 반환
              const parseRange = (str) => {
                const nums = (str || "").match(/-?\d+(?:\.\d+)?/g);
                if (!nums || !nums.length) return null;
                const start = parseFloat(nums[0]);
                const end = parseFloat(nums[1] ?? nums[0]);
                if (!isFinite(start) || !isFinite(end)) return null;
                return { start, end };
              };

              // 초 -> "MM:SS.ss" (소수 2자리) 포맷터
              const toMMSSms = (sec, digits = 2) => {
                if (typeof sec !== "number" || !isFinite(sec)) return "--:--";
                const m = Math.floor(sec / 60);
                const s = sec - m * 60;
                const sStr = s.toFixed(digits).padStart(2 + (digits ? digits + 1 : 0), "0");
                return `${String(m).padStart(2, "0")}:${sStr}`;
              };

              // stutter_details[].timestamps 배열을 펼쳐서 구간 리스트 만들기
              const ranges = details
                .flatMap((d) => d.timestamps || [])
                .map(parseRange)
                .filter(Boolean)
                .sort((a, b) => a.start - b.start);

              if (!ranges.length) return <div>표시할 타임스탬프가 없습니다.</div>;

              // 스타일
              const chip = {
                display: "inline-block",
                padding: "6px 10px",
                margin: "6px",
                borderRadius: 9999,
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
                fontWeight: 700,
                fontSize: 14,
              };

              const reported = resultData?.details?.audio?.results?.stutter?.stutter_count;
              const parsedCount = ranges.length;

              return (
                <div>
                  {/* 상단 요약 */}
                  <div style={{ marginBottom: 8, color: "#64748b", fontSize: 14 }}>
                    총 {parsedCount}개 구간
                    {typeof reported === "number" && reported !== parsedCount
                      ? ` (서버 보고: ${reported}회)`
                      : ""}
                  </div>

                  {/* 구간 뱃지 리스트 */}
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {ranges.map((r, i) => (
                      <span key={`${r.start}-${r.end}-${i}`} style={chip}>
                        {toMMSSms(r.start)} – {toMMSSms(r.end)}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}
          </section>
          



          <section style={{ marginTop: 24 }}>
            <h3 style={{ margin: "8px 0 12px" }}>종합 피드백</h3>

            {(() => {
              const md = resultData?.summary?.finalFeedback;
              if (!md) return <div>피드백을 생성하는 데 실패했습니다.</div>;

              const card = {
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 16,
                padding: "18px 20px",
                maxWidth: 980,
                margin: "0 auto",
              };

              // 타이포 스타일
              const S = {
                h1: { fontSize: 24, fontWeight: 800, margin: "12px 0 8px" },
                h2: { fontSize: 20, fontWeight: 800, margin: "12px 0 6px" },
                h3: { fontSize: 18, fontWeight: 800, margin: "10px 0 4px" },
                p:  { fontSize: 16, lineHeight: 1.75, margin: "8px 0", whiteSpace: "pre-wrap" },
                strong: { fontWeight: 800 },
                ul: { paddingLeft: 22, margin: "6px 0" },
                ol: { paddingLeft: 22, margin: "6px 0" },
                li: { margin: "4px 0", lineHeight: 1.7 },
                blockquote: {
                  borderLeft: "4px solid #e2e8f0",
                  margin: "10px 0",
                  padding: "6px 12px",
                  color: "#475569",
                  background: "#f8fafc",
                  borderRadius: 8,
                },
                code: {
                  background: "#f1f5f9",
                  padding: "2px 6px",
                  borderRadius: 6,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  fontSize: 14,
                },
              };

              return (
                <div style={card}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: (props) => <h2 style={S.h1} {...props} />,
                      h2: (props) => <h3 style={S.h2} {...props} />,
                      h3: (props) => <h4 style={S.h3} {...props} />,
                      p:  (props) => <p  style={S.p}  {...props} />,
                      strong: (props) => <strong style={S.strong} {...props} />,
                      ul: (props) => <ul style={S.ul} {...props} />,
                      ol: (props) => <ol style={S.ol} {...props} />,
                      li: (props) => <li style={S.li} {...props} />,
                      blockquote: (props) => <blockquote style={S.blockquote} {...props} />,
                      code: (props) => <code style={S.code} {...props} />,
                    }}
                  >
                    {md}
                  </ReactMarkdown>
                </div>
              );
            })()}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ResultPage;