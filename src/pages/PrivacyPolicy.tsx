
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
            <p className="text-gray-600 mt-2">Last updated: June 5, 2025</p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="prose prose-gray max-w-none">
            
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Introduction</h2>
            <p className="text-gray-700 mb-6">
              Welcome to Kind Word Society. This Privacy Policy explains how we collect, use, disclose, 
              and safeguard your information when you use our web application. Please read this privacy 
              policy carefully. If you do not agree with the terms of this privacy policy, please do not 
              access the application.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
            <h3 className="text-lg font-medium text-gray-800 mb-3">Personal Information</h3>
            <p className="text-gray-700 mb-4">
              We may collect personally identifiable information that you voluntarily provide to us when you:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700">
              <li>Register for an account</li>
              <li>Use our services</li>
              <li>Contact us for support</li>
              <li>Subscribe to our newsletter</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">Usage Data</h3>
            <p className="text-gray-700 mb-6">
              We automatically collect certain information when you visit, use, or navigate our application. 
              This information does not reveal your specific identity but may include device and usage information, 
              such as your IP address, browser characteristics, operating system, language preferences, 
              referring URLs, and information about how and when you use our application.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">
              We use the information we collect or receive to:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700">
              <li>Provide, operate, and maintain our application</li>
              <li>Improve, personalize, and expand our application</li>
              <li>Understand and analyze how you use our application</li>
              <li>Develop new products, services, features, and functionality</li>
              <li>Communicate with you for customer service and support</li>
              <li>Send you updates and marketing communications</li>
              <li>Process your transactions and manage your orders</li>
              <li>Find and prevent fraud</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">Sharing Your Information</h2>
            <p className="text-gray-700 mb-6">
              We do not sell, trade, or otherwise transfer your personal information to third parties without 
              your consent, except in the following circumstances:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700">
              <li>To comply with legal obligations</li>
              <li>To protect and defend our rights and property</li>
              <li>To prevent or investigate possible wrongdoing</li>
              <li>To protect the personal safety of users or the public</li>
              <li>With your explicit consent</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">Third-Party Services</h2>
            <p className="text-gray-700 mb-6">
              Our application may integrate with third-party services such as Google Calendar and Gmail. 
              When you connect these services, you grant us permission to access specific data as outlined 
              in the authorization process. We only access the minimum data necessary to provide our services.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Security</h2>
            <p className="text-gray-700 mb-6">
              We implement appropriate technical and organizational security measures to protect your personal 
              information against unauthorized access, alteration, disclosure, or destruction. However, please 
              note that no method of transmission over the internet or electronic storage is 100% secure.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Retention</h2>
            <p className="text-gray-700 mb-6">
              We retain your personal information only for as long as necessary to fulfill the purposes outlined 
              in this Privacy Policy, unless a longer retention period is required or permitted by law. 
              Completed tasks are automatically deleted after 24 hours.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Rights</h2>
            <p className="text-gray-700 mb-4">
              Depending on your location, you may have the following rights regarding your personal information:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700">
              <li>The right to access your personal information</li>
              <li>The right to update or correct your personal information</li>
              <li>The right to delete your personal information</li>
              <li>The right to restrict processing of your personal information</li>
              <li>The right to data portability</li>
              <li>The right to withdraw consent</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">Cookies and Tracking</h2>
            <p className="text-gray-700 mb-6">
              We use cookies and similar tracking technologies to track activity on our application and 
              store certain information. You can set your browser to refuse all cookies or to indicate 
              when a cookie is being sent. However, if you do not accept cookies, you may not be able 
              to use some portions of our application.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">Children's Privacy</h2>
            <p className="text-gray-700 mb-6">
              Our application is not intended for children under the age of 13. We do not knowingly collect 
              personal information from children under 13. If you are a parent or guardian and believe your 
              child has provided us with personal information, please contact us.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">Changes to This Privacy Policy</h2>
            <p className="text-gray-700 mb-6">
              We may update our Privacy Policy from time to time. We will notify you of any changes by 
              posting the new Privacy Policy on this page and updating the "Last updated" date. You are 
              advised to review this Privacy Policy periodically for any changes.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 mb-6">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-gray-700">
                <strong>Email:</strong> privacy@kindwordsociety.com<br />
                <strong>Address:</strong> [Your Company Address]<br />
                <strong>Phone:</strong> [Your Phone Number]
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
