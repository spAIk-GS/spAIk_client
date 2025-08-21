import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './HistoryPage.scss';

const HistoryPage = () => {
    // 상태 관리 (페이징 관련 상태 제거)
    const [historyList, setHistoryList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 날짜 포맷팅 함수
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('ko-KR', options);
    };

    // 컴포넌트가 처음 로드될 때 한 번만 데이터를 불러옴
    useEffect(() => {
        const fetchHistory = async () => {
            setIsLoading(true);
            setError(null);
            const token = localStorage.getItem("accessToken");

            if (!token) {
                setError("로그인이 필요합니다.");
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`http://localhost:8080/users/me/history`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('분석 기록을 불러오는 데 실패했습니다.');
                }

                const data = await response.json();
                
                setHistoryList(data.content); // 실제 데이터는 'content' 배열에 담겨있음

            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, []); // 👈 의존성 배열을 비워서 최초 1회만 실행되도록 변경

    // 렌더링 로직
    const renderContent = () => {
        if (isLoading) {
            return <div className="loading">로딩 중...</div>;
        }
        if (error) {
            return <div className="error">{error}</div>;
        }
        if (historyList.length === 0) {
            return <div className="no-history">분석 기록이 없습니다.</div>;
        }

        return (
            <ul className="history-list">
                {historyList.map(item => (
                    <li key={item.reportId} className="history-item">
                        <Link to={`/result/${item.presentationId}`}>
                        <div className="history-dot"></div>
                        <img 
                            className="history-thumbnail" 
                            src={item.thumbnailUrl} 
                            alt="분석 썸네일" 
                        />
                        <div className="history-text">
                            <span className="history-date">{formatDate(item.createdAt)}</span>
                            <span className="history-title">&nbsp;분석 결과 보기</span>
                        </div>
                        </Link>
                    </li>
                ))}
            </ul>
        );
    };


    return (
        <div className="history-page">
            <Header />
            <main className="history-main">
                <div className='container'>
                <h2>AI 분석 과거 기록</h2>
                {renderContent()}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default HistoryPage;