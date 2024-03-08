import React from 'react';
import HomeAboutImg from '../../assets/images/about/about.jpg';

const HomeAbout = () => {
    return (
        <>
            <div className="about-area gray-bg-2 pt-200 pb-160">
                <div className="container">
                    <div className="row">
                        <div className="col-xl-6 col-lg-6 col-md-6">
                            <div className="about-img-style-1">
                                <img src={HomeAboutImg} alt="" />
                                <div className="about-award">
                                    <h3>We Are Since 2000! Over 200 Awards</h3>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-6 col-lg-6 col-md-6">
                            <div className="about-text-wrapper pt-30">
                                <div className="section-title mb-40">
                                    <span>We are Committed to Landscape Service</span>
                                    <h2 className="mb-30">Are you a driven entrepreneur looking for a business opportunity in the automotive industry? </h2>
                                    <p>The MOMS Mobile Oil Change Licensing Program offers a unique chance to be your own boss and provide a valuable service – convenient oil changes delivered right to customers' doorsteps.                                        <br /><br /> Explore the MOMS Mobile Oil Change Licensing Program and discover how you can turn your entrepreneurial dream into a reality.  Contact us today to learn more about franchise opportunities in your area! </p>
                                </div>
                                <a href="/contact" className="l-btn">Appointment</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default HomeAbout;