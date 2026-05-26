import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import Loader from '../../components/Loader';
import SimpleSurveyTemplateForm from '../../components/survey/SimpleSurveyTemplateForm';
import {
  createDefaultTemplates,
  fetchTemplates,
  removeSurveyTemplate,
  upsertTemplate,
} from '../../services/surveyApi';
import '../../styles/components/SurveyManagerSimplified.css';
import { buildAppUrl } from '../../utils/appPaths';
import { getReturnUrl } from '../../utils/returnUrl';

const SURVEY_TABS = [
  {
    key: 'preExam',
    label: 'Pre-Exam Survey Template',
    description: 'Configure questions students answer before starting the exam.',
  },
  {
    key: 'postExam',
    label: 'Post-Exam Survey Template',
    description: 'Configure questions students answer after submitting the exam.',
  },
];

const normalizeTemplatesResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.templates)) return data.templates;
  return [];
};

export default function SurveyTemplateManager() {
  const { examId } = useParams();
  const [templates, setTemplates] = useState(null);
  const [activeTab, setActiveTab] = useState('preExam');
  const [loadingDefaults, setLoadingDefaults] = useState(false);
  const [savingTemplateId, setSavingTemplateId] = useState(null);
  const [removingTemplateId, setRemovingTemplateId] = useState(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const autoCreateHandled = useRef(false);

  const loadTemplates = useCallback(async () => {
    try {
      const response = await fetchTemplates(examId);
      setTemplates(normalizeTemplatesResponse(response.data));
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load templates');
      setTemplates([]);
    }
  }, [examId]);

  useEffect(() => {
    if (examId) {
      loadTemplates();
    }
  }, [examId, loadTemplates]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (autoCreateHandled.current || templates === null || params.get('autoCreate') !== 'true') {
      return;
    }

    autoCreateHandled.current = true;

    const preExamEnabled = params.get('preExamEnabled') === 'true';
    const postExamEnabled = params.get('postExamEnabled') === 'true';

    const autoCreateTemplates = async () => {
      setLoadingDefaults(true);
      try {
        await createDefaultTemplates(examId, {
          preExamEnabled,
          postExamEnabled,
        });
        toast.success('Survey templates created');
        await loadTemplates();

        params.delete('autoCreate');
        params.delete('preExamEnabled');
        params.delete('postExamEnabled');
        const cleanQuery = params.toString();
        window.history.replaceState(
          {},
          document.title,
          `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ''}`
        );
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Failed to create templates');
      } finally {
        setLoadingDefaults(false);
      }
    };

    autoCreateTemplates();
  }, [examId, loadTemplates, templates]);

  useEffect(() => {
    setShowRemoveConfirm(false);
  }, [activeTab]);

  const normalizedTemplates = useMemo(() => {
    return Array.isArray(templates) ? templates : [];
  }, [templates]);

  const activeTemplate = useMemo(() => {
    return normalizedTemplates.find((template) => template.surveyType === activeTab);
  }, [normalizedTemplates, activeTab]);

  const hasPreTemplate = normalizedTemplates.some((template) => template.surveyType === 'preExam');
  const hasPostTemplate = normalizedTemplates.some(
    (template) => template.surveyType === 'postExam'
  );

  const integrationLinks = useMemo(() => {
    return {
      setup: buildAppUrl(`/admin/exams/${examId}/survey-templates`),
      pre: buildAppUrl(`/student/exams/${examId}/before-survey`),
      post: buildAppUrl(`/student/exams/${examId}/after-survey`),
      report: buildAppUrl(`/admin/exams/${examId}/survey-report`),
      quizBack: getReturnUrl('/admin/exams'),
    };
  }, [examId]);

  const copyLink = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Link copied');
    } catch (_error) {
      toast.info(value);
    }
  };

  const handleCreateDefault = async (type) => {
    setLoadingDefaults(true);

    try {
      await createDefaultTemplates(examId, {
        preExamEnabled: type === 'preExam',
        postExamEnabled: type === 'postExam',
      });

      toast.success(
        type === 'preExam'
          ? 'Pre-exam survey template created'
          : 'Post-exam survey template created'
      );

      setActiveTab(type);
      await loadTemplates();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to create template');
    } finally {
      setLoadingDefaults(false);
    }
  };

  const handleCreateBothDefaults = async () => {
    setLoadingDefaults(true);

    try {
      await createDefaultTemplates(examId, {
        preExamEnabled: true,
        postExamEnabled: true,
      });

      toast.success('Survey templates created');
      await loadTemplates();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to create templates');
    } finally {
      setLoadingDefaults(false);
    }
  };

  const handleSave = async (template) => {
    const templateToSave = template || activeTemplate;
    if (!templateToSave) return;

    setSavingTemplateId(templateToSave._id);

    try {
      await upsertTemplate(templateToSave._id, templateToSave);
      toast.success('Template saved');
      await loadTemplates();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save template');
    } finally {
      setSavingTemplateId(null);
    }
  };

  const handleRemoveTemplate = async () => {
    if (!activeTemplate) return;

    setRemovingTemplateId(activeTemplate._id);

    try {
      await removeSurveyTemplate(activeTemplate._id);

      toast.success('Survey configuration removed');

      setTemplates((prev) =>
        (prev || []).filter((template) => template._id !== activeTemplate._id)
      );
      setShowRemoveConfirm(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to remove survey template');
    } finally {
      setRemovingTemplateId(null);
    }
  };

  if (templates === null) return <Loader />;

  const activeTabMeta = SURVEY_TABS.find((tab) => tab.key === activeTab);

  return (
    <div className="survey-manager-simplified">
      {/* Header */}
      <div className="card manager-header">
        <div>
          <h1>Survey Configuration</h1>
          <p className="header-desc">Create and manage surveys for your quiz</p>
        </div>
        <a className="text-link" href={integrationLinks.quizBack}>
          ← Back to Quiz
        </a>
      </div>

      {/* Quick Status */}
      <div className="quick-status">
        <div className="status-item">
          <span className="status-label">Before Exam</span>
          <span className={`status-badge ${hasPreTemplate ? 'ready' : 'empty'}`}>
            {hasPreTemplate ? '✓ Ready' : '○ Not Created'}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">After Exam</span>
          <span className={`status-badge ${hasPostTemplate ? 'ready' : 'empty'}`}>
            {hasPostTemplate ? '✓ Ready' : '○ Not Created'}
          </span>
        </div>
      </div>

      {/* Integration Links - Simplified */}
      <div className="card">
        <h2>Integration Links</h2>
        <p className="section-desc">Use these links to share surveys</p>
        <div className="links-grid">
          <button type="button" className="link-button" onClick={() => copyLink(integrationLinks.pre)}>
            <div className="link-icon">📋</div>
            <div>
              <div className="link-title">Before Exam</div>
              <div className="link-hint">Copy survey link</div>
            </div>
          </button>
          <button type="button" className="link-button" onClick={() => copyLink(integrationLinks.post)}>
            <div className="link-icon">📋</div>
            <div>
              <div className="link-title">After Exam</div>
              <div className="link-hint">Copy survey link</div>
            </div>
          </button>
          <button type="button" className="link-button" onClick={() => copyLink(integrationLinks.setup)}>
            <div className="link-icon">⚙️</div>
            <div>
              <div className="link-title">Setup</div>
              <div className="link-hint">Copy setup link</div>
            </div>
          </button>
          <a href={integrationLinks.report} className="link-button">
            <div className="link-icon">📊</div>
            <div>
              <div className="link-title">Reports</div>
              <div className="link-hint">View responses</div>
            </div>
          </a>
        </div>
      </div>

      {/* Tab Navigation - Simplified */}
      <div className="card">
        <div className="tab-nav-simple">
          {SURVEY_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const exists = tab.key === 'preExam' ? hasPreTemplate : hasPostTemplate;

            return (
              <button
                key={tab.key}
                type="button"
                className={`tab-button ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <span className="tab-title">{tab.label}</span>
                <span className={`tab-status ${exists ? 'configured' : 'pending'}`}>
                  {exists ? 'Configured' : 'Create'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Create Templates Section - if needed */}
      {!hasPreTemplate || !hasPostTemplate ? (
        <div className="card create-section">
          <h2>Get Started</h2>
          <p className="section-desc">Create survey templates to begin</p>
          <div className="create-buttons">
            {!hasPreTemplate && (
              <button
                type="button"
                className="btn-create"
                onClick={() => handleCreateDefault('preExam')}
                disabled={loadingDefaults}
              >
                <span className="btn-emoji">📝</span>
                <span>{loadingDefaults ? 'Creating...' : 'Create Before Exam Survey'}</span>
              </button>
            )}

            {!hasPostTemplate && (
              <button
                type="button"
                className="btn-create"
                onClick={() => handleCreateDefault('postExam')}
                disabled={loadingDefaults}
              >
                <span className="btn-emoji">📝</span>
                <span>{loadingDefaults ? 'Creating...' : 'Create After Exam Survey'}</span>
              </button>
            )}

            {!hasPreTemplate && !hasPostTemplate && (
              <button 
                type="button" 
                className="btn-create primary"
                onClick={handleCreateBothDefaults} 
                disabled={loadingDefaults}
              >
                <span className="btn-emoji">✨</span>
                <span>{loadingDefaults ? 'Creating...' : 'Create Both Surveys'}</span>
              </button>
            )}
          </div>
        </div>
      ) : null}

      {/* Active Template Section */}
      <div className="card template-section">
        <div className="template-header">
          <div>
            <h2>{activeTabMeta?.label}</h2>
            <p className="section-desc">{activeTabMeta?.description}</p>
          </div>
          {activeTemplate && (
            <button
              type="button"
              className="btn-danger"
              onClick={() => setShowRemoveConfirm(true)}
              disabled={removingTemplateId === activeTemplate._id}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showRemoveConfirm && activeTemplate ? (
        <div className="card danger-confirm">
          <h3>Remove Survey?</h3>
          <p>Existing responses will be kept. Students won't see this survey anymore.</p>
          <div className="confirm-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowRemoveConfirm(false)}
              disabled={removingTemplateId === activeTemplate._id}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-danger"
              onClick={handleRemoveTemplate}
              disabled={removingTemplateId === activeTemplate._id}
            >
              {removingTemplateId === activeTemplate._id ? 'Removing...' : 'Yes, Remove'}
            </button>
          </div>
        </div>
      ) : null}

      {/* Survey Template Form */}
      {activeTemplate ? (
        <SimpleSurveyTemplateForm
          template={activeTemplate}
          onSave={handleSave}
          saving={savingTemplateId === activeTemplate._id}
        />
      ) : (
        <div className="card empty-template">
          <div className="empty-icon">📋</div>
          <h3>
            {activeTab === 'preExam'
              ? 'Before Exam Survey'
              : 'After Exam Survey'} not created yet
          </h3>

          <p>Create this template to add questions for this survey.</p>

          <button
            type="button"
            className="btn-primary"
            onClick={() => handleCreateDefault(activeTab)}
            disabled={loadingDefaults}
          >
            {loadingDefaults ? 'Creating...' : 'Create Template'}
          </button>
        </div>
      )}
    </div>
  );
}
