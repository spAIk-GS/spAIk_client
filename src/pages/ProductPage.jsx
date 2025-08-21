import React from "react";
import "./ProductPage.scss";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { motion } from "framer-motion";
import productImage from "../assets/productPageImage.png";
import graphImage from "../assets/graphImage.png";
import videoImage from "../assets/videoModelImage.png";
import audioImage from "../assets/audioModelImage.png";


function ProductPage() {
  return (

    <div className="product-page">
      <Header />
      <main className="page-content">
        {/* HERO */}
        <section className="hero container">
            <div className="hero__copy">
            <h1>
                <span className="brand">spAIk</span> uses cutting-edge
                <span className="ai"> AI Technology</span> to analyze
                <br />
                Presentation Videos and provide
                <br />
                both <span className="emphasis">Visual</span> and
                <span className="emphasis"> Quantitative Feedback</span>.
            </h1>
            </div>

            <div className="product-page__illustration">
            <motion.img
                src={productImage}
                alt="Illustration"
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 1 }}
            />
            </div>
            <div className="graph">
            <motion.img
                src={graphImage}
                alt="Illustration"
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 1 }}
            />
            </div>
        </section>

        <section className="hero container">
            <div className="hero__copy2">
            <h1>
                Designed to help users to improve their
                <br />
                public speaking skills,
                <br />
                <span className="brand">spAIk</span> evaluates elements such as
                <br />
                eye contact, facial expressions, posture, voice tone, etc.
            </h1>
            </div>
        </section>

        <section className="hero container">
            <div className="hero__copy3">
            <h1>
                By combining an <span className="model">ONNXRuntime</span> and
                <br />
                OpenCV-based <span className="model">Head-Pose-Estimation Model</span>
                <br />
                with Google’s Mediapipe,
                <br />
                our system accurately detects
                <br />
                eye movement and gesture dynamics.
            </h1>
            </div>

            <div className="video">
            <motion.img
                src={videoImage}
                alt="Illustration"
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 1 }}
            />
            </div>
        </section>

        <section className="hero container">
            <div className="hero__copy4">
            <h1>
                Using <span className="model2">OpenAI’s Whisper model</span> for
                <br />
                speech extraction and advanced
                <br />
                audio analysis libraries such as <span className="model2">Librosa</span>,
                <br />
                the system measures speaking rate, pitch,
                <br />
                and volume variations with fine granularity.
            </h1>
            </div>

            <div className="audio">
            <motion.img
                src={audioImage}
                alt="Illustration"
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 1 }}
            />
            </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default ProductPage;