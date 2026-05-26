import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import SurveyReport from '../pages/admin/SurveyReport';
import SurveyTemplateManager from '../pages/admin/SurveyTemplateManager';
import BeforeExamSurvey from '../pages/student/BeforeExamSurvey';
import AfterExamSurvey from '../pages/student/AfterExamSurvey';
import HomePage from '../pages/shared/HomePage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/admin/exams/:examId/survey-templates" element={<SurveyTemplateManager />} />
      <Route path="/admin/exams/:examId/survey-report" element={<SurveyReport />} />
      <Route path="/student/exams/:examId/before-survey" element={<BeforeExamSurvey />} />
      <Route path="/student/exams/:examId/after-survey" element={<AfterExamSurvey />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
