import React from 'react';
import Feature1 from '../../assets/images/icon/satisfaction-guarantee.png';
import Feature2 from '../../assets/images/icon/professional-team.png';
import Feature3 from '../../assets/images/icon/material-instrument.png';
import Feature4 from '../../assets/images/icon/experience.png';

const Feature = () => {
    return (
        <>
            <div className="features-area bg-white pt-110 pb-110">
                <div className="container">
                    <div className="row">
                        <div className="col-xl-3 col-lg-3 col-md-6">
                            <div className="single-feature text-center box-shadow-3">
                                <div className="single-feature-icon">
                                    <img src={Feature1} alt="" />
                                </div>
                                <h5>Proven Business Model</h5>
                                <p>Benefit from a well-established brand and a proven system for success.</p>
                            </div>
                        </div>
                        <div className="col-xl-3 col-lg-3 col-md-6">
                            <div className="single-feature text-center box-shadow-3">
                                <div className="single-feature-icon">
                                    <img src={Feature2} alt="" />
                                </div>
                                <h5>Be Your Own Boss/h5>
                                <p>TSet your own hours and build a business you can be proud of.</p>
                            </div>
                        </div>
                        <div className="col-xl-3 col-lg-3 col-md-6">
                            <div className="single-feature text-center box-shadow-3">
                                <div className="single-feature-icon">
                                    <img src={Feature3} alt="" />
                                </div>
                                <h5>Low Overhead</h5>
                                <p>Eliminate the high costs associated with brick-and-mortar locations.</p>
                            </div>
                        </div>
                        <div className="col-xl-3 col-lg-3 col-md-6">
                            <div className="single-feature text-center box-shadow-3">
                                <div className="single-feature-icon">
                                    <img src={Feature4} alt="" />
                                </div>
                                <h5>Training and Support</h5>
                                <p>Receive comprehensive training and ongoing support from the MOMS team.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Feature;