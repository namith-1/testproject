import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createNewCourse } from '../../store';
import { 
    Plus, Trash2, Save, BookOpen, Clock, Layers, GitBranch, 
    Video, FileText, CheckSquare, Settings, ChevronRight, ChevronDown, MoreVertical
} from 'lucide-react';
import QuizBuilder from '../../components/QuizBuilder'; // Import the new component
import '../css/CourseEditor.css'; 

// ==========================================
// 1. UTILITIES & CONFIGURATION
// ==========================================
const COURSE_DATA_PATH = 'local_course_draft'; 

const generateId = () => Date.now() + Math.random().toString(36).substr(2, 9);

const createNewModule = (type = 'text', parentId = null) => ({
    id: generateId(),
    parentId: parentId,
    type: type, 
    title: type === 'intro' ? 'Course Introduction' : `New ${type.charAt(0).toUpperCase() + type.slice(1)} Module`,
    description: '',
    text: type === 'text' ? 'Start writing your content here...' : '',
    videoLink: type === 'video' ? 'https://www.youtube.com/embed/dQw4w9WgXcQ' : '',
    // Quiz Data Structure
    quizData: {
        questions: [] 
    },
    children: [], 
});

const initialCourseStructure = {
    rootModule: createNewModule('intro', null),
    modules: {}, 
    courseTitle: "Untitled Course",
    courseDescription: "A description for the entire course.",
    subject: "General",
};

// Helper returns an ELEMENT
const renderModuleIcon = (type) => {
    const props = { size: 16, className: "module-icon-type" };
    switch (type) {
        case 'intro': return <BookOpen {...props} />;
        case 'text': return <FileText {...props} />;
        case 'video': return <Video {...props} />;
        case 'quiz': return <CheckSquare {...props} />;
        default: return <Layers {...props} />;
    }
};

const deleteModuleFromStructure = (modules, moduleId) => {
    const moduleToDelete = modules[moduleId];
    if (!moduleToDelete) return modules;
    
    const moduleIdsToDelete = [moduleId];
    const findChildrenToDelete = (children) => {
        children.forEach(childId => {
            moduleIdsToDelete.push(childId);
            if (modules[childId] && modules[childId].children) {
                findChildrenToDelete(modules[childId].children);
            }
        });
    };
    findChildrenToDelete(moduleToDelete.children);

    // Remove from parent's children array
    if (moduleToDelete.parentId && modules[moduleToDelete.parentId]) {
        modules[moduleToDelete.parentId].children = modules[moduleToDelete.parentId].children.filter(id => id !== moduleId);
    }
    
    const newModules = { ...modules };
    moduleIdsToDelete.forEach(id => delete newModules[id]);
    return newModules;
};

// ==========================================
// 2. SUB-COMPONENTS
// ==========================================

const ModuleActions = ({ module, onAction, isRoot }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    return (
        <div className="module-actions-wrapper">
            <button 
                className="module-actions-btn" 
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                title="Options"
            >
                <MoreVertical size={16} />
            </button>
            {isMenuOpen && (
                <div ref={menuRef} className="module-actions-menu">
                    <button onClick={(e) => { e.stopPropagation(); onAction('add', module.id); setIsMenuOpen(false); }}>
                        <Plus size={14} className="text-green-600" /> Add Sub-Module
                    </button>
                    {!isRoot && (
                        <button onClick={(e) => { e.stopPropagation(); onAction('delete', module.id); setIsMenuOpen(false); }}>
                            <Trash2 size={14} className="text-red-600" /> Delete Module
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

// Recursive Tree Item
const ModuleTreeItem = ({ modules, moduleId, onSelect, onAction, selectedId, rootId, depth = 0 }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const module = modules[moduleId];
    
    if (!module) return null;

    const isSelected = module.id === selectedId;
    const hasChildren = module.children && module.children.length > 0;
    const isRoot = module.id === rootId;

    const toggleExpand = (e) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    return (
        <li className="tree-node">
            <div 
                className={`module-item ${isSelected ? 'active' : ''}`}
                onClick={() => onSelect(module.id)}
                style={{ paddingLeft: `${depth * 16 + 12}px` }}
            >
                <div className="module-title-wrapper">
                    <div 
                        className={`expand-icon ${hasChildren ? 'visible' : 'hidden'}`} 
                        onClick={hasChildren ? toggleExpand : undefined}
                    >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>
                    
                    {renderModuleIcon(module.type)}
                    <span className="module-title-text">{module.title}</span>
                </div>
                
                <ModuleActions 
                    module={module} 
                    onAction={onAction} 
                    isRoot={isRoot} 
                />
            </div>
            
            {hasChildren && isExpanded && (
                <ul className="module-children-list">
                    {module.children.map(childId => (
                        <ModuleTreeItem 
                            key={childId}
                            modules={modules}
                            moduleId={childId}
                            onSelect={onSelect}
                            onAction={onAction}
                            selectedId={selectedId}
                            rootId={rootId}
                            depth={depth + 1}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
};

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
const CourseEditor = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    // State
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [courseStructure, setCourseStructure] = useState(initialCourseStructure);
    const [selectedModuleId, setSelectedModuleId] = useState(initialCourseStructure.rootModule.id);
    const [isIntroModuleForm, setIsIntroModuleForm] = useState(true);

    // Merge root module into map for consistent lookups
    const allModules = useMemo(() => ({
        [courseStructure.rootModule.id]: courseStructure.rootModule,
        ...courseStructure.modules
    }), [courseStructure]);

    const selectedModule = allModules[selectedModuleId] || courseStructure.rootModule;
    
    // Load Draft
    useEffect(() => {
        const storedData = localStorage.getItem(COURSE_DATA_PATH);
        if (storedData) {
            try {
                const loaded = JSON.parse(storedData);
                if (loaded.rootModule) {
                    setCourseStructure(loaded);
                    setLastSaved(localStorage.getItem(COURSE_DATA_PATH + '_time'));
                    setSelectedModuleId(loaded.rootModule.id);
                    setIsIntroModuleForm(true);
                }
            } catch (e) {
                console.error("Error loading draft", e);
            }
        }
    }, []);

    const saveDraft = useCallback((structure) => {
        setIsSaving(true);
        localStorage.setItem(COURSE_DATA_PATH, JSON.stringify(structure));
        localStorage.setItem(COURSE_DATA_PATH + '_time', new Date().toISOString());
        setTimeout(() => setIsSaving(false), 500);
        setLastSaved(new Date().toISOString());
    }, []);

    // --- ACTIONS ---
    const handleSelectModule = (id) => {
        setSelectedModuleId(id);
        setIsIntroModuleForm(id === courseStructure.rootModule.id);
    };

    const handleAddModule = useCallback((parentId) => {
        const parentModule = allModules[parentId];
        if (!parentModule) return;

        const newModule = createNewModule('text', parentId);
        
        const updatedParent = { 
            ...parentModule, 
            children: [...parentModule.children, newModule.id] 
        };
        
        setCourseStructure(prev => {
            const newModulesMap = { ...prev.modules };
            newModulesMap[newModule.id] = newModule;

            let nextState;
            if (parentId === prev.rootModule.id) {
                nextState = { ...prev, rootModule: updatedParent, modules: newModulesMap };
            } else {
                newModulesMap[parentId] = updatedParent;
                nextState = { ...prev, modules: newModulesMap };
            }

            saveDraft(nextState);
            return nextState;
        });

        setSelectedModuleId(newModule.id);
        setIsIntroModuleForm(false);
    }, [allModules, saveDraft]);
    
    const handleDeleteModule = useCallback((moduleId) => {
        if (moduleId === courseStructure.rootModule.id) {
            alert("Cannot delete the root module.");
            return;
        }

        if (window.confirm("Delete this module and ALL sub-modules?")) {
            const updatedModules = deleteModuleFromStructure(allModules, moduleId);
            const moduleToDelete = allModules[moduleId];
            const parentId = moduleToDelete.parentId;
            
            let updatedRoot = { ...courseStructure.rootModule };
            
            if (parentId === courseStructure.rootModule.id) {
                updatedRoot.children = updatedRoot.children.filter(id => id !== moduleId);
            } else if (updatedModules[parentId]) {
                updatedModules[parentId] = {
                    ...updatedModules[parentId],
                    children: updatedModules[parentId].children.filter(id => id !== moduleId)
                };
            }
            delete updatedModules[courseStructure.rootModule.id];

            const newStructure = { 
                ...courseStructure, 
                modules: updatedModules, 
                rootModule: updatedRoot 
            };

            setCourseStructure(newStructure);
            saveDraft(newStructure);
            setSelectedModuleId(courseStructure.rootModule.id);
            setIsIntroModuleForm(true);
        }
    }, [allModules, courseStructure, saveDraft]);

    const handleModuleAction = (action, moduleId) => {
        if (action === 'add') handleAddModule(moduleId);
        if (action === 'delete') handleDeleteModule(moduleId);
    };

    const handleModuleFormChange = (field, value) => {
        setCourseStructure(prev => {
            const targetId = selectedModuleId;
            const isRoot = targetId === prev.rootModule.id;
            const currentModule = isRoot ? prev.rootModule : prev.modules[targetId];
            
            if (!currentModule) return prev;

            const newModuleData = { ...currentModule, [field]: value };
            
            if (isRoot) {
                return { ...prev, rootModule: newModuleData };
            } else {
                return { 
                    ...prev, 
                    modules: { ...prev.modules, [targetId]: newModuleData } 
                };
            }
        });
    };

    const handleCourseMetaChange = (field, value) => {
        setCourseStructure(prev => ({ ...prev, [field]: value }));
    };

    // Autosave Timer
    useEffect(() => {
        const timer = setTimeout(() => saveDraft(courseStructure), 60000);
        return () => clearTimeout(timer);
    }, [courseStructure, saveDraft]);

    // Publish Course
    const handlePublishCourse = async () => {
        if (!courseStructure.courseTitle || !courseStructure.subject) {
            alert("Please provide Title and Subject.");
            return;
        }

        if (window.confirm("Publish this course?")) {
            setIsSaving(true);
            try {
                const payload = {
                    courseTitle: courseStructure.courseTitle,
                    courseDescription: courseStructure.courseDescription,
                    subject: courseStructure.subject,
                    rootModule: courseStructure.rootModule,
                    modules: courseStructure.modules
                };

                const result = await dispatch(createNewCourse(payload));
                if (createNewCourse.fulfilled.match(result)) {
                    localStorage.removeItem(COURSE_DATA_PATH);
                    navigate('/instructor-dashboard');
                } else {
                    alert(`Failed: ${result.payload}`);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsSaving(false);
            }
        }
    };

    return (
        <div className="course-editor-app">
            {/* SIDEBAR */}
            <div className="module-tree-sidebar">
                <div className="editor-header">
                    <h2>Course Builder</h2>
                    <Settings size={18} className="icon-btn" onClick={() => handleSelectModule(courseStructure.rootModule.id)} />
                </div>
                
                <div className="save-course-bar">
                    <input 
                        type="text" 
                        className="sidebar-input"
                        placeholder="Course Title"
                        value={courseStructure.courseTitle}
                        onChange={(e) => handleCourseMetaChange('courseTitle', e.target.value)}
                        required={true}
                    />
                     <input 
                        type="text" 
                        className="sidebar-input"
                        placeholder="Subject"
                        value={courseStructure.subject}
                        onChange={(e) => handleCourseMetaChange('subject', e.target.value)}
                         required={true}
                    />
                    <button onClick={handlePublishCourse} disabled={isSaving} className="btn-publish-course">
                        <Save size={16} /> Publish
                    </button>
                </div>

                <div className="tree-container">
                    <ul className="module-tree-list">
                        <ModuleTreeItem 
                            modules={allModules} 
                            moduleId={courseStructure.rootModule.id}
                            onSelect={handleSelectModule}
                            onAction={handleModuleAction}
                            selectedId={selectedModuleId}
                            rootId={courseStructure.rootModule.id}
                        />
                    </ul>
                </div>
            </div>

            {/* EDITOR AREA */}
            <div className="module-editor-content">
                <div className="module-editor-card">
                    <div className="card-header">
                        <h2>{isIntroModuleForm ? 'Course Settings' : 'Edit Module'}</h2>
                        <span className="module-id-badge">ID: {selectedModule.title}</span>
                    </div>
                    
                    <div className="form-field">
                        <label>Title</label>
                        <input 
                            type="text"
                            value={selectedModule.title}
                            onChange={(e) => handleModuleFormChange('title', e.target.value)}
                             required={true}
                        />
                    </div>

                    {!isIntroModuleForm ? (
                        <>
                            <div className="form-grid">
                                <div className="form-field">
                                    <label>Type</label>
                                    <select 
                                        value={selectedModule.type}
                                        onChange={(e) => {
                                            handleModuleFormChange('type', e.target.value);
                                            // Reset Defaults logic
                                            const def = createNewModule(e.target.value);
                                            handleModuleFormChange('text', def.text);
                                            handleModuleFormChange('videoLink', def.videoLink);
                                            // Ensure quizData init
                                            if (e.target.value === 'quiz') {
                                                handleModuleFormChange('quizData', { questions: [] });
                                            }
                                        }}
                                    >
                                        <option value="text">Text Lesson</option>
                                        <option value="video">Video Lesson</option>
                                        <option value="quiz">Quiz</option>
                                    </select>
                                </div>
                                <div className="form-field">
                                    <label>Description</label>
                                    <input 
                                        type="text"
                                        value={selectedModule.description}
                                        onChange={(e) => handleModuleFormChange('description', e.target.value)}
                                        placeholder="Short summary..."
                                         required={true}
                                    />
                                </div>
                            </div>

                            {/* --- CONDITIONAL RENDERING BASED ON TYPE --- */}
                            
                            {selectedModule.type === 'text' && (
                                <div className="form-field">
                                    <label>Content</label>
                                    <textarea 
                                        rows="12"
                                        value={selectedModule.text}
                                        onChange={(e) => handleModuleFormChange('text', e.target.value)}
                                    />
                                </div>
                            )}

                            {selectedModule.type === 'video' && (
                                <div className="form-field">
                                    <label>Video Embed URL</label>
                                    <input 
                                        type="url"
                                        value={selectedModule.videoLink}
                                        onChange={(e) => handleModuleFormChange('videoLink', e.target.value)}
                                        placeholder="https://www.youtube.com/embed/..."
                                        required={true}

                                    />
                                </div>
                            )}

                            {selectedModule.type === 'quiz' && (
                                <div className="form-field">
                                    <QuizBuilder 
                                        quizData={selectedModule.quizData || { questions: [] }} 
                                        onChange={(newData) => handleModuleFormChange('quizData', newData)} 
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                         <div className="form-field">
                            <label>Course Description</label>
                            <textarea 
                                rows="6"
                                value={courseStructure.courseDescription}
                                onChange={(e) => handleCourseMetaChange('courseDescription', e.target.value)}
                                placeholder="Describe the course..."
                            />
                        </div>
                    )}

                    <div className="editor-footer">
                        <button className="btn-add-child" onClick={() => handleAddModule(selectedModuleId)}>
                            <Plus size={16} /> Add Sub-Module
                        </button>
                        
                        {!isIntroModuleForm && (
                            <button className="btn-delete-module" onClick={() => handleDeleteModule(selectedModuleId)}>
                                <Trash2 size={16} /> Delete
                            </button>
                        )}

                        <div className="autosave-status">
                            <Clock size={14} />
                            <span>{isSaving ? 'Saving...' : `Draft saved: ${lastSaved ? new Date(lastSaved).toLocaleTimeString() : 'Just now'}`}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseEditor;


// ### 3. `client/src/components/course-player/QuizTaker.jsx` (New Student Component)

// This component will be used later in the Student's "Course Viewer" to take the quiz.


// http://googleusercontent.com/immersive_entry_chip/1