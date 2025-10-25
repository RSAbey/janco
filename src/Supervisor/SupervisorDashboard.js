import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaUserClock, 
  FaUsers, 
  FaCalendarAlt, 
  FaMoneyBillWave, 
  FaBoxes, 
  FaMoneyCheckAlt,
  FaHardHat
} from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import { projectService } from "../services/projectService";

const SupervisorDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Fetch supervisor's projects
    useEffect(() => {
        const fetchSupervisorProjects = async () => {
            try {
                setLoading(true);
                // Fetch projects filtered by supervisor name
                const allProjects = await projectService.getProjects();
                
                // Filter projects where supervisor matches the logged-in user's name
                const supervisorProjects = allProjects.filter(project => 
                    project.supervisor?.toLowerCase() === `${user?.firstName} ${user?.lastName}`.toLowerCase()
                );
                
                setProjects(supervisorProjects);
            } catch (err) {
                console.error("Failed to fetch projects:", err);
                setError("Failed to load projects");
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchSupervisorProjects();
        }
    }, [user]);

    // Common card style with 3D effects
    const cardStyle = {
        background: 'linear-gradient(145deg, #48bb78, #38a169)',
        borderRadius: '24px',
        padding: '20px',
        color: 'white',
        fontWeight: '600',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `
            0 10px 20px rgba(0, 0, 0, 0.19),
            0 6px 6px rgba(0, 0, 0, 0.23),
            inset 0 -2px 5px rgba(0, 0, 0, 0.1)
        `,
        border: '1px solid rgba(255, 255, 255, 0.18)',
        transform: 'translateY(0) rotateX(0)',
        transformStyle: 'preserve-3d',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden'
    };
    
    // Hover effect for cards
    const hoverEffect = {
        boxShadow: `
            0 14px 28px rgba(0, 0, 0, 0.25),
            0 10px 10px rgba(0, 0, 0, 0.22),
            inset 0 -2px 5px rgba(0, 0, 0, 0.15)
        `,
        transform: 'translateY(-5px) rotateX(5deg)',
    };
    
    // Icon container style
    const iconContainerStyle = {
        background: 'rgba(255, 255, 255, 0.2)',
        padding: '12px',
        borderRadius: '50%',
        marginBottom: '12px',
        transform: 'translateZ(20px)',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
    };
    
    return (
        <div className="min-h-screen bg-gray-100 p-4">
            {/* Header */}
            <header className="flex items-center justify-between mb-4"></header>

            {/* Combined Welcome and My Projects Section Card */}
            <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
                <div className="flex flex-col md:flex-row items-center justify-between">
                    {/* Welcome Section - Left */}
                    <div className="flex-1 mb-4 md:mb-0 md:mr-6">
                        <p className="text-lg font-semibold">Welcome Back!</p>
                        <p className="text-sm text-gray-600">
                            Hi, {user?.firstName} {user?.lastName}
                        </p>
                    </div>

                    {/* My Projects Section - Right */}
                    <div className="flex-1">
                        {loading ? (
                            <p className="text-gray-600 text-center md:text-left">Loading projects...</p>
                        ) : error ? (
                            <p className="text-red-600 text-center md:text-left">{error}</p>
                        ) : projects.length === 0 ? (
                            <p className="text-gray-600 text-center md:text-left">No projects assigned to you</p>
                        ) : (
                            <div className="space-y-3">
                                {projects.slice(0, 2).map((project) => (
                                    <div
                                        key={project._id}
                                        onClick={() => navigate(`/constructionSites/projectDetails/${project._id}`)}
                                        className="flex items-center gap-3 p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                                    >
                                        <div className="bg-green-200 p-2 rounded-full">
                                            <FaHardHat className="w-4 h-4 text-green-600" />
                                        </div>
                                        <span className="font-semibold text-sm text-gray-800">{project.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="col-span-1 flex flex-col gap-4 h-full">
                <div 
                    style={cardStyle}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = hoverEffect.transform;
                        e.currentTarget.style.boxShadow = hoverEffect.boxShadow;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = cardStyle.transform;
                        e.currentTarget.style.boxShadow = cardStyle.boxShadow;
                    }}
                    onClick={() => {
                        if (projects.length > 0) {
                        navigate("/supervisordash/labourer-attendance", { 
                            state: { projectId: projects[0]._id } 
                        });
                        } else {
                        alert("No projects available. Please contact your manager.");
                        }
                    }}
                    >
                    <div style={iconContainerStyle}>
                        <FaUserClock className="w-8 h-8" />
                    </div>
                    <span className="text-center text-sm md:text-base" style={{transform: 'translateZ(10px)'}}>Labourer Attendances</span>
                    </div>

                    <div 
                    style={cardStyle}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = hoverEffect.transform;
                        e.currentTarget.style.boxShadow = hoverEffect.boxShadow;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = cardStyle.transform;
                        e.currentTarget.style.boxShadow = cardStyle.boxShadow;
                    }}
                    onClick={() => {
                        if (projects.length > 0) {
                        navigate("/supervisordash/labourers", { 
                            state: { projectId: projects[0]._id } 
                        });
                        } else {
                        // Handle case where no projects are available
                        alert("No projects available. Please contact your manager.");
                        }
                    }}
                    >
                    <div style={iconContainerStyle}>
                        <FaUsers className="w-8 h-8" />
                    </div>
                    <span className="text-center text-sm md:text-base" style={{transform: 'translateZ(10px)'}}>Labourer Details</span>
                    </div>
                    
                    <div 
                    style={cardStyle}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = hoverEffect.transform;
                        e.currentTarget.style.boxShadow = hoverEffect.boxShadow;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = cardStyle.transform;
                        e.currentTarget.style.boxShadow = cardStyle.boxShadow;
                    }}
                    onClick={() => {
                        if (projects.length > 0) {
                        navigate("/supervisordash/work-schedule", { 
                            state: { projectId: projects[0]._id } 
                        });
                        } else {
                        alert("No projects available. Please contact your manager.");
                        }
                    }}
                    >
                    <div style={iconContainerStyle}>
                        <FaCalendarAlt className="w-8 h-8" />
                    </div>
                    <span className="text-center text-sm md:text-base" style={{transform: 'translateZ(10px)'}}>Work Schedule</span>
                    </div>
                </div>

                {/* Right Column */}
                <div className="col-span-1 flex flex-col gap-4 h-full">
                    <div 
                    style={cardStyle}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = hoverEffect.transform;
                        e.currentTarget.style.boxShadow = hoverEffect.boxShadow;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = cardStyle.transform;
                        e.currentTarget.style.boxShadow = cardStyle.boxShadow;
                    }}
                    onClick={() => {
                        if (projects.length > 0) {
                        navigate("/supervisordash/labourer-salary", { 
                            state: { projectId: projects[0]._id } 
                        });
                        } else {
                        alert("No projects available. Please contact your manager.");
                        }
                    }}
                    >
                    <div style={iconContainerStyle}>
                        <FaMoneyBillWave className="w-8 h-8" />
                    </div>
                    <span className="text-center text-sm md:text-base" style={{transform: 'translateZ(10px)'}}>Labourer Salary</span>
                    </div>

                    <div 
                        style={cardStyle}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = hoverEffect.transform;
                            e.currentTarget.style.boxShadow = hoverEffect.boxShadow;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = cardStyle.transform;
                            e.currentTarget.style.boxShadow = cardStyle.boxShadow;
                        }}
                        onClick={() => {
                            if (projects.length > 0) {
                            navigate("/supervisordash/material-stocks", { 
                                state: { projectId: projects[0]._id } 
                            });
                            } else {
                            alert("No projects available. Please contact your manager.");
                            }
                        }}
                    >
                        <div style={iconContainerStyle}>
                            <FaBoxes className="w-8 h-8" />
                        </div>
                        <span className="text-center text-sm md:text-base" style={{transform: 'translateZ(10px)'}}>Material Stocks</span>
                    </div>
                    
                    <div 
                    style={cardStyle}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = hoverEffect.transform;
                        e.currentTarget.style.boxShadow = hoverEffect.boxShadow;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = cardStyle.transform;
                        e.currentTarget.style.boxShadow = cardStyle.boxShadow;
                    }}
                    onClick={() => {
                        if (projects.length > 0) {
                        navigate("/supervisordash/expenses", { 
                            state: { projectId: projects[0]._id } 
                        });
                        } else {
                        alert("No projects available. Please contact your manager.");
                        }
                    }}
                    >
                    <div style={iconContainerStyle}>
                        <FaMoneyCheckAlt className="w-8 h-8" />
                    </div>
                    <span className="text-center text-sm md:text-base" style={{transform: 'translateZ(10px)'}}>Expenses</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupervisorDashboard;