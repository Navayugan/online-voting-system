/**
 * context/OrgContext.js
 * Loads organization branding info on app start
 */
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_BASE } from '../api/config';

export const getOrgTerms = (orgType) => {
  const type = (orgType || '').toUpperCase();

  if (type === 'SCHOOL') {
    return {
      memberSingular: 'Student',
      memberPlural: 'Students',
      memberIdLabel: 'Student / Roll No',
      memberIdShort: 'Roll / Student ID',
      memberIdPlaceholder: 'e.g. STU1001 or Roll No',
      memberNameLabel: 'Student Name',
      memberTypeLabel: 'Student Category',
      roleOrDesignationLabel: 'Class / Grade / Section',
      roleOrDesignationPlaceholder: 'e.g. Grade 10 - Section A',
      portalName: 'Student Portal',
      portalLoginTitle: 'Student Voting Portal',
      portalLoginSubtitle: 'Student accounts are registered and managed by school administration.',
      taxOrGstnLabel: 'Affiliation / Registration No.',
      taxOrGstnPlaceholder: 'e.g. CBSE / State Board Reg No.',
      orgNamePlaceholder: "e.g. St. Xavier's High School",
      isSchoolOrCollege: true,
    };
  }

  if (type === 'COLLEGE') {
    return {
      memberSingular: 'Student',
      memberPlural: 'Students',
      memberIdLabel: 'Roll No / Register No',
      memberIdShort: 'Roll / Reg ID',
      memberIdPlaceholder: 'e.g. 21CS042 or Reg No',
      memberNameLabel: 'Student Name',
      memberTypeLabel: 'Student Category',
      roleOrDesignationLabel: 'Degree / Year / Branch',
      roleOrDesignationPlaceholder: 'e.g. B.Tech CSE - 3rd Year',
      portalName: 'Student Portal',
      portalLoginTitle: 'Student Voting Portal',
      portalLoginSubtitle: 'Student accounts are registered and managed by college administration.',
      taxOrGstnLabel: 'University / AISHE Code',
      taxOrGstnPlaceholder: 'e.g. AISHE / University Reg Code',
      orgNamePlaceholder: 'e.g. National College of Engineering',
      isSchoolOrCollege: true,
    };
  }

  if (type === 'EDUCATIONAL_INSTITUTION') {
    return {
      memberSingular: 'Student',
      memberPlural: 'Students',
      memberIdLabel: 'Student / Roll ID',
      memberIdShort: 'Student ID',
      memberIdPlaceholder: 'e.g. STU-1001',
      memberNameLabel: 'Student Name',
      memberTypeLabel: 'Student Category',
      roleOrDesignationLabel: 'Course / Program',
      roleOrDesignationPlaceholder: 'e.g. Diploma - Year 2',
      portalName: 'Student Portal',
      portalLoginTitle: 'Student Voting Portal',
      portalLoginSubtitle: 'Student accounts are registered and managed by institution administration.',
      taxOrGstnLabel: 'Institution Registration No.',
      taxOrGstnPlaceholder: 'e.g. Board / Institute Reg No.',
      orgNamePlaceholder: 'e.g. Institute of Modern Sciences',
      isSchoolOrCollege: true,
    };
  }

  if (type === 'HOSPITAL') {
    return {
      memberSingular: 'Staff',
      memberPlural: 'Staff Members',
      memberIdLabel: 'Staff ID',
      memberIdShort: 'Staff ID',
      memberIdPlaceholder: 'e.g. MED-1001',
      memberNameLabel: 'Staff Name',
      memberTypeLabel: 'Staff Category',
      roleOrDesignationLabel: 'Role / Designation',
      roleOrDesignationPlaceholder: 'e.g. Resident Doctor, Head Nurse',
      portalName: 'Staff Portal',
      portalLoginTitle: 'Staff Voting Portal',
      portalLoginSubtitle: 'Staff accounts are registered and managed by hospital administration.',
      taxOrGstnLabel: 'Hospital License / Reg No.',
      taxOrGstnPlaceholder: 'e.g. Clinical Establishment Reg No.',
      orgNamePlaceholder: 'e.g. City General Hospital',
      isSchoolOrCollege: false,
    };
  }

  if (type === 'NGO' || type === 'NON_PROFIT') {
    return {
      memberSingular: 'Member',
      memberPlural: 'Members',
      memberIdLabel: 'Member ID',
      memberIdShort: 'Member ID',
      memberIdPlaceholder: 'e.g. MEM-1001',
      memberNameLabel: 'Member Name',
      memberTypeLabel: 'Membership Type',
      roleOrDesignationLabel: 'Role / Designation',
      roleOrDesignationPlaceholder: 'e.g. Core Member, Volunteer Lead',
      portalName: 'Member Portal',
      portalLoginTitle: 'Member Voting Portal',
      portalLoginSubtitle: 'Member accounts are registered and managed by organization administration.',
      taxOrGstnLabel: 'Society / NGO Registration No.',
      taxOrGstnPlaceholder: 'e.g. 12A / 80G / Society Reg No.',
      orgNamePlaceholder: 'e.g. Green Earth Foundation',
      isSchoolOrCollege: false,
    };
  }

  // Default: Corporate / Private Company / Public Company / Other
  return {
    memberSingular: 'Employee',
    memberPlural: 'Employees',
    memberIdLabel: 'Employee ID',
    memberIdShort: 'Emp ID',
    memberIdPlaceholder: 'e.g. EMP1001',
    memberNameLabel: 'Employee Name',
    memberTypeLabel: 'Employee Type',
    roleOrDesignationLabel: 'Designation',
    roleOrDesignationPlaceholder: 'e.g. Senior Software Engineer',
    portalName: 'Employee Portal',
    portalLoginTitle: 'Employee Voting Portal',
    portalLoginSubtitle: 'Employee accounts are registered and managed by organization administrators.',
    taxOrGstnLabel: 'Company GSTN Number (Optional)',
    taxOrGstnPlaceholder: 'e.g. 33AAAAA0000A1Z5',
    orgNamePlaceholder: 'e.g. ABC Technologies Pvt Ltd',
    isSchoolOrCollege: false,
  };
};

export const OrgContext = createContext();

export const OrgProvider = ({ children }) => {
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrg = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/public/organization`);
      if (res.data.success) {
        setOrg(res.data.organization);
      } else {
        setOrg(null);
      }
    } catch (e) {
      console.warn('Could not load org info');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrg(); }, []);

  const isOrgConfigured = Boolean(org && org.org_name && org.org_name.trim().length > 0);
  const terms = getOrgTerms(org?.org_type);

  return (
    <OrgContext.Provider value={{ org, loading, refetch: fetchOrg, isOrgConfigured, terms, getOrgTerms }}>
      {children}
    </OrgContext.Provider>
  );
};

export const useOrg = () => useContext(OrgContext);
