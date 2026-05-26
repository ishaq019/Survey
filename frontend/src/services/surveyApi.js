import api from './api';
import { getParticipantId } from '../utils/participant';

const toType = (t) => (t === 'postExam' || t === 'post' ? 'post' : 'pre');

export const fetchTemplates = (examId) => api.get(`/survey-templates/exams/${examId}`);

export const createDefaultTemplates = (examId, payload) =>
  api.post(`/survey-templates/exams/${examId}/defaults`, payload);

export const upsertTemplate = (templateId, payload) =>
  api.put(`/survey-templates/${templateId}`, payload);

export const removeSurveyTemplate = (templateId) => api.delete(`/survey-templates/${templateId}`);

export const fetchStudentSurvey = (examId, surveyType, getQuestionWise = false, questionIndex = null) => {
  const params = { participantId: getParticipantId() };
  
  // Add question-wise parameters if fetching questions
  if (getQuestionWise) {
    params.getQuestionWise = 'true';
    if (questionIndex !== null) {
      params.questionIndex = questionIndex;
    }
  }
  
  return api.get(`/surveys/student/exams/${examId}/${toType(surveyType)}`, { params });
};

export const submitStudentSurvey = (examId, surveyType, payload) =>
  api.post(`/surveys/student/exams/${examId}/${toType(surveyType)}`, {
    ...payload,
    participantId: payload?.participantId || getParticipantId(),
  });

export const fetchSurveyReport = (examId) => api.get(`/surveys/admin/exams/${examId}/report`);
