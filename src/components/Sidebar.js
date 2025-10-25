"use client"
import { NavLink, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

const menuItems = [
  { name: "Summary", icon: "/SidebarIcons/Chart.svg", path: "/dashboard" },
  // { name: "Construction Area", icon: "/SidebarIcons/Construction.svg", path: "/construction" },
  { name: "Construction Sites", icon: "/SidebarIcons/Construction.svg", path: "/constructionSites" },
  { name: "Employees Database", icon: "/SidebarIcons/Management.svg", path: "/employees" },
  { name: "Material Database", icon: "/SidebarIcons/icon _box_.svg", path: "/materials" },
  { name: "Suppliers Details", icon: "/SidebarIcons/🦆 icon _cart_.svg", path: "/suppliers" },
  {
    name: (
      <>
        Sub-contractor
        <br />
        Details
      </>
    ),
    icon: "/SidebarIcons/🦆 icon _people_.svg",
    path: "/customers",
  },
  { name: "Supervisor", icon: "/SidebarIcons/manager.svg", path: "/supervisordash", requiredRole: "supervisor" },
  { name: "Finance", icon: "/SidebarIcons/Wallet.svg", path: "/finance" },
]

const Sidebar = ({ isOpen }) => {
  const location = useLocation()
  const { user } = useAuth()

  console.log("Current location:", location.pathname)

  console.log(isOpen)

  // If supervisor, show only Supervisor section
  let filteredMenuItems = menuItems
  if (user && (user.position?.toLowerCase().trim() === "supervisor" || user.role?.toLowerCase().trim() === "supervisor")) {
    filteredMenuItems = menuItems.filter((item) => item.path.startsWith("/supervisordash"))
  } else {
    filteredMenuItems = menuItems.filter((item) => {
      if (item.requiredRole) {
        return user && user.role === item.requiredRole
      }
      return true
    })
  }

  return (
    <div
      className={`h-full bg-green-100 transition-all duration-300 
      ${isOpen ? "w-56" : "w-0"} md:w-16 lg:w-56 overflow-hidden md:overflow-visible flex flex-col`}
    >
      <div className="flex-1">
        <h2 className="text-xl font-bold text-green-700 p-4">Menu</h2>
        <nav>
          <ul className="space-y-2 p-4">
            {filteredMenuItems.map(({ name, icon, path }) => (
              <li key={name}>
                <NavLink
                  to={path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 p-2 text-sm truncate ${
                      isActive || location.pathname === path ? "bg-green-300 font-bold" : "hover:bg-green-200"
                    }`
                  }
                >
                  <img src={icon || "/placeholder.svg"} alt={name} className="w-5 h-5" />
                  {name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Copyright Notice - Fixed at bottom */}
      <div className="p-4 border-t border-green-300 mt-auto">
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-1">
            <a 
              href="https://360tecnologies.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700 hover:underline cursor-pointer"
            >
              360tecnologies.com
            </a>
          </p>
          <p className="text-xs text-gray-600">
            © 2025-2026 360 Technologies International.<br />
            All rights reserved
          </p>
        </div>
      </div>
    </div>
  )
}

export default Sidebar