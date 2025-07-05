import React from 'react';
// import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        // <footer className="main-footer">
        //     <div className="footer-content">
        //         <div className="footer-section about">
        //             <h2 className="footer-logo">
        //                 <span className="logo-icon">🏥</span> Hopewell HMS
        //             </h2>
        //             <p>
        //                 Providing compassionate and cutting-edge healthcare. Your well-being is our top priority.
        //             </p>
        //             <div className="social-links">
        //                 <a href="#"><i className="fab fa-facebook-f"></i></a>
        //                 <a href="#"><i className="fab fa-twitter"></i></a>
        //                 <a href="#"><i className="fab fa-instagram"></i></a>
        //                 <a href="#"><i className="fab fa-linkedin-in"></i></a>
        //             </div>
        //         </div>

        //         <div className="footer-section links">
        //             <h3>Quick Links</h3>
        //             <ul>
        //                 <li><Link to="/patient/login">Patient Portal</Link></li>
        //                 <li><Link to="/login">Staff Login</Link></li>
        //                 <li><a href="#">Find a Doctor</a></li>
        //                 <li><a href="#">Services</a></li>
        //                 <li><a href="#">Contact Us</a></li>
        //             </ul>
        //         </div>

        //         <div className="footer-section contact">
        //             <h3>Contact Information</h3>
        //             <p><i className="fas fa-map-marker-alt"></i> 123 Health St, Wellness City, 12345</p>
        //             <p><i className="fas fa-phone"></i> (123) 456-7890</p>
        //             <p><i className="fas fa-envelope"></i> contact@hopewell.com</p>
        //         </div>
        //     </div>

        <div className="footer-bottom">
            © {currentYear} Hopewell Hospital Management System | All Rights Reserved
        </div>
        // </footer>
    );
};

export default Footer;