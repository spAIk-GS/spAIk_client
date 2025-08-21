import "./UploadPage.scss";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const UploadPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef();
  const [dragOver, setDragOver] = useState(false);
  const [step, setStep] = useState(1); //단계 상태(1: 업로드, 2: preview 화면)
  const [videoMetadata, setVideoMetadata] = useState({
    duration: null,
    width: null,
    height: null,
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState("업로드 준비중"); // 새 상태 추가
  const [presentationId, setPresentationId] = useState(null);

  const [analysisCompleted, setAnalysisCompleted] = useState(false); // 분석 완료 여부 상태
  const [analysisResult, setAnalysisResult] = useState(null); // 분석 결과 저장 상태
  const navigate = useNavigate();
  


  // selectedFile이 바뀔 때마다 URL 생성하고 정리
  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setVideoUrl(url);
      return () => {
        URL.revokeObjectURL(url); // 정리
      };
    }
  }, [selectedFile]);


  useEffect(() => {
    // analyzing 상태가 아닐 때는 아무것도 하지 않음
    if (!analyzing || !presentationId) return;

    const token = localStorage.getItem("accessToken");
    console.log("SSE 연결에 사용될 토큰:", token);
    if (!token) {
      alert("로그인이 필요합니다.");
      setAnalyzing(false); // 분석 상태 중단
      return;
    }
    
    const eventSource = new EventSource(
      `http://localhost:8080/analysis/subscribe/${presentationId}?token=${token}`
    );
    

    // 2. 연결 성공 시
    eventSource.onopen = () => {
      console.log("SSE connection opened.");
      setAnalysisStatus("AI 분석 서버에 연결되었어요.");
    };

    // 3. 서버로부터 메시지 수신 시
    eventSource.onmessage = (event) => {
      console.log("📩 SSE message RECEIVED:", event.data);
      try {
          const data = JSON.parse(event.data); // 👈 받은 데이터를 JSON으로 파싱

          // 서버가 진행 상황 메시지를 보낼 경우
          if (data.status && data.status !== "COMPLETED") {
              setAnalysisStatus(data.message); // 예: { "status": "PROCESSING", "message": "시선 분석 중..." }
          }
          
          // 서버가 최종 분석 결과를 보낼 경우
          if (data.status === "COMPLETED") {
              console.log("분석 최종 결과 수신:", data.result);
              setAnalysisResult(data.result); // 👈 결과 데이터 저장
              setAnalysisCompleted(true);      // 👈 분석 완료 상태로 변경
              setAnalysisStatus("분석이 완료되었습니다! 아래 버튼을 눌러 결과를 확인하세요.");
              eventSource.close(); // 👈 SSE 연결 종료
              console.log("🛑 SSE connection CLOSED by client after completion.");
          }

      } catch (error) {
          // JSON 파싱이 불가능한 일반 텍스트 메시지 처리 (기존 로직)
          setAnalysisStatus(event.data);
      }
    };

    // 4. 에러 발생 시
    eventSource.onerror = (error) => {
      console.error("SSE error:", error);
      setAnalysisStatus("오류가 발생했어요. 잠시 후 다시 시도해주세요.");
      eventSource.close(); // 에러 발생 시 연결 종료
    };
    
    // 5. 컴포넌트 언마운트 시 또는 analyzing이 false가 될 때 연결 정리
    return () => {
      eventSource.close();
      console.log("SSE connection closed on cleanup.");
    };

  }, [analyzing, presentationId]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && isValidExtension(file.name)) {
      setSelectedFile(file);
    } else {
      alert("MP4 또는 MOV 파일만 업로드할 수 있습니다.");
      e.target.value = "";
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && isValidExtension(file.name)) {
      setSelectedFile(file);
    } else {
      alert("MP4 또는 MOV 파일만 업로드할 수 있습니다.");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const isValidExtension = (fileName) => {
    const allowedExtensions = ['mp4', 'mov'];
    const ext = fileName.split('.').pop().toLowerCase();
    return allowedExtensions.includes(ext);
  };

  const handleArrowClick = () => {
    if (!selectedFile) {
      alert("먼저 파일을 선택해주세요.");
      return;
    }

    // File size check (1GB = 1024 * 1024 * 1024 bytes)
    const maxSize = 1024 * 1024 * 1024; 
    if (selectedFile.size > maxSize) {
      alert("파일 크기는 1GB 이하여야 합니다.");
      return;
    }

    // Video duration check (단위: 초)
    const durationMinutes = videoMetadata.duration / 60;
    if (durationMinutes < 3 || durationMinutes > 15) {
      alert("영상 길이는 3분 이상 15분 이하이어야 합니다.");
      //return; 나중에 제거
    }

    // 조건 통과 시 다음 단계로 이동
    setStep(2);
  };

  const handleBack = () => {
    setSelectedFile(null);
    setStep(1);
  };

  const formatDuration = (duration) => {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const generateThumbnailName = (originalFileName) => {
    const baseName = originalFileName.split(".").slice(0, -1).join(".");
    return `${baseName}_thumbnail.jpeg`;
  };

  const captureThumbnail = (videoUrl) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.src = videoUrl;
      video.crossOrigin = "anonymous";
      video.currentTime = 1;

      video.onloadeddata = () => {
        video.currentTime = 1;
      };

      video.onseeked = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const thumbnailFileName = generateThumbnailName(selectedFile.name);
            const thumbFile = new File([blob], thumbnailFileName, {
              type: "image/jpeg",
            });
            resolve(thumbFile);
          } else {
            reject(new Error("썸네일 생성 실패"));
          }
        }, "image/jpeg", 0.95);
      };

      video.onerror = (e) => reject(new Error("비디오 로드 실패"));
    });
  };

  const getPresignedUrl = async (fileName, type) => {
    const endpoint =
      type === "video"
        ? "http://localhost:8080/videos/presign"
        : "http://localhost:8080/thumbnails/presign";
    const token = localStorage.getItem("accessToken");

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ fileName }),
    });

    if (!response.ok) throw new Error("Presigned URL 요청 실패");
    const data = await response.json();
    console.log(`[PRESIGN] type=${type} file=${fileName}`);
    console.log(`[PRESIGN] url=`, data.url);
    return data.url;
  };

  const uploadToS3 = async (file, url) => {
    await axios.put(url, file, {
      headers: {
        "Content-Type": file.type,
      },
      onUploadProgress: (progressEvent) => {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(percent);
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
  };

  function getAuthHeader() {
    let t = localStorage.getItem("accessToken")?.trim();
    if (!t) throw new Error("로그인이 필요합니다. 토큰이 없습니다.");
    if (!t.startsWith("Bearer ")) t = `Bearer ${t}`;
    return t;
  }

  // 2) 요청 함수
  const requestAnalysis = async (videoFileName) => {
    const auth = getAuthHeader(); // "Bearer x.y.z" 형태로 보장

    console.log("/analysis/start API에 분석 시작을 요청합니다...");
    const response = await fetch("http://localhost:8080/analysis/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: auth,
      },
      body: JSON.stringify({ fileName: videoFileName }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("[/analysis/start ERROR]", response.status, text);
      throw new Error(response.status === 401 ? "인증 실패(다시 로그인 필요)" : "AI 분석 요청 실패");
    }

    const result = await response.json(); 
    console.log("/analysis/start API 응답 수신:", result);
    if (result.presentationId) {
      console.log("presentationId를 성공적으로 받았습니다:", result.presentationId);
      setPresentationId(result.presentationId); // 받아온 ID를 상태에 저장
    } else {
      console.error("응답에 presentationId가 없습니다!");
      throw new Error("presentationId를 받아오지 못했습니다.");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return alert("먼저 파일을 선택해주세요.");

    setAnalyzing(true); //추가
    setUploadProgress(0);

    try {
      // 썸네일 생성
      const thumbnail = await captureThumbnail(videoUrl);
      setThumbnailFile(thumbnail);

      // presigned URL 요청
      const [videoUrlRes, thumbUrlRes] = await Promise.all([
        getPresignedUrl(selectedFile.name, "video"),
        getPresignedUrl(thumbnail.name, "thumbnail"),
      ]);

      // 업로드
      await Promise.all([
        uploadToS3(selectedFile, videoUrlRes),
        uploadToS3(thumbnail, thumbUrlRes),
      ]);

      // 분석 요청
      await requestAnalysis(selectedFile.name);
      console.log("requestAnalysis 함수가 성공적으로 완료되었습니다.");
    } catch (error) {
      console.error("Upload or Analysis Error:", error);
      alert("업로드 중 오류 발생: " + error.message);
      setAnalyzing(false);
    }
  };


  return (
    <div className="upload-page">
      <Header />

      <main className="upload-page__main">
        {analyzing ? (
          <div className="analysis-layout">
            {/* LEFT: gray placeholder (external site area) */}
            <div className="analysis-left">
              <div className="iframe-scale-wrap">
                <iframe
                  src="/mbti_tobe4/mbti_tobe4/mbti.html"   // 여기에 보여줄 사이트 URL
                  title="MBTI Page"
                />
              </div>
            </div>

            {/* RIGHT: phone-styled panel */}
            <div className="analysis-right">
              <div className="phone">
                <div className="phone-top">
                </div>

                <div className="phone-screen">
                  {thumbnailFile ? (
                    <img
                      src={URL.createObjectURL(thumbnailFile)}
                      alt="썸네일 미리보기"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "8px"
                      }}
                    />
                  ) : (
                    <div className="spinner" />
                  )}
                </div>

                <div className="speech">
                  <p>{analysisStatus}</p>
                </div>

                <div className="phone-bottom">
                  <button
                    className="feedback-button"
                    disabled={!analysisCompleted} // analysisCompleted가 true일 때만 버튼 활성화
                    onClick={() => navigate('/result/${presentationId}', { state: { result: analysisResult } })} // (결과 데이터를 state에 담아서 전달)
                  >
                    Result Feedback
                  </button>
                </div>
              </div>

              <div className="progress-wrap">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="progress-text">
                  {uploadProgress > 0 && uploadProgress < 100
                    ? `${uploadProgress}%`
                    : uploadProgress === 100
                    ? "업로드 완료!  분석중... 시간이 다소 걸릴 수 있습니다"
                    : "업로드 준비중"}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div 
            className={`upload-box ${dragOver ? "drag-over" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {step === 1 ? (
              <>
                <h2 className="upload-title">Upload your Presentation</h2>
                <p className="upload-description">
                  MP4 또는 MOV 형식의 영상 파일을 끌어 놓습니다.
                </p>
                <p className="upload-description2">
                  {"(File Size < 1GB, Video Length = 3~15 min)"}
                </p>
                
                <div className="upload-button">
                  <button className="file-btn" onClick={handleButtonClick}>
                    파일 선택
                  </button>
                  <span className="arrow" onClick={handleArrowClick}>»</span>
                  <input
                    type="file"
                    accept=".mp4, .mov" //확장자 제한
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                </div>

                {selectedFile && (
                  <p className="file-name">선택된 파일: {selectedFile.name}</p>
                )}
              </>
            ) : (
              <>
                <div className="video-info-box">
                  <div className="video-info-text">
                    <p><strong>File Name:&nbsp;</strong> {selectedFile?.name}</p>
                    <p><strong>File Size:&nbsp;</strong> {(selectedFile?.size / (1024 * 1024)).toFixed(2)} MB</p>
                    <p><strong>Video Length:&nbsp;</strong> 
                      {videoMetadata.duration !== null
                        ? formatDuration(videoMetadata.duration)
                        : "Loading..."}
                    </p>
                    <p><strong>Resolution:&nbsp;</strong> 
                      {videoMetadata.width && videoMetadata.height
                        ? `${videoMetadata.width} x ${videoMetadata.height}`
                        : "Loading..."}
                    </p>
                  </div>

                  <div className="video-preview">
                    <video
                      src={videoUrl}
                      controls
                      preload="metadata"
                      style={{
                        borderRadius: '12px',
                        maxWidth: '320px',
                        maxHeight: '180px',
                        objectFit: 'cover',
                      }}
                      onLoadedMetadata={(e) => {
                        const video = e.target;
                        setVideoMetadata({
                          duration: video.duration,
                          width: video.videoWidth,
                          height: video.videoHeight,
                        });
                      }}
                    />
                  </div>
                </div>

                <div className="analyze-button-container">
                  <button className="analyze-button" onClick={handleUpload}>
                    Start AI Analysis!
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default UploadPage;