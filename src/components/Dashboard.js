import React, { useState, useEffect } from 'react';
import NewSummary from './NewSummary.js'; // Import the Summary component
import "../assets/css/Dashboard.css";
import Pagination from '@mui/material/Pagination';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('pending'); // Changed to 'pending' to handle both cases
  const [data, setData] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemTravelInfo, setSelectedItemTravelInfo] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentUserId, setCurrentUserId] = useState(null);

  const { auth, login } = useAuth(); // Access auth from context
  const { username, password } = auth;
  const authHeader = 'Basic ' + btoa(username + ':' + password);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedPassword = localStorage.getItem('password');

    if (storedUsername && storedPassword && (username !== storedUsername || password !== storedPassword)) {
      login(storedUsername, storedPassword);
    }
  }, [login, username, password]);

  const fetchUserId = async () => {
    try {
      const response = await fetch('http://localhost:8080/o/headless-admin-user/v1.0/my-user-account', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': authHeader,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const user = await response.json();
      setCurrentUserId(user.emailAddress);
    } catch (error) {
      console.error('Error fetching user ID:', error);
    }
  };

  useEffect(() => {
    if (username && password) {
      fetchUserId();
    }
  }, [username, password]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleIdClick = async (item) => {
    setSelectedItem(item);
    try {
      const response = await fetch(`http://localhost:8080/o/c/travelinfos/${item.id}/itineraryRelation`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': authHeader,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const travelInfo = await response.json();
      console.log('Travel Information Response:', travelInfo);
      setSelectedItemTravelInfo(travelInfo.items || []);
    } catch (error) {
      console.error('Error fetching travel information:', error);
      setSelectedItemTravelInfo([]);
    }
  };

  const handleBack = () => {
    setSelectedItem(null);
    setSelectedItemTravelInfo(null);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (event) => {
    setItemsPerPage(Number(event.target.value));
    setCurrentPage(1);
  };

  const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:8080/o/c/travelinfos/', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': authHeader,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Fetched Data:', result); // Log the fetched data
        setData(result);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [authHeader]);

  const filteredData = data.items
    .filter(item => {
      const approver1Name = (item.manager);
      const approver2Name = (item.hod);
      const user = (currentUserId);
      // Filter based on user being either Approver 1 or Approver 2
      return approver1Name === user || approver2Name === user;
    })
    .filter(item => {
      if (activeTab === 'pending') {
        return item.approveStatus?.key === 'pendingAtApprover1' || item.approveStatus?.key === 'pendingAtApprover2';
      }
      if (activeTab === 'approved') {
        return item.approveStatus?.key === 'approved' || item.approveStatus?.key === 'pendingAtApprover2';
      }
      return item.approveStatus?.key === activeTab;
    })
    .filter(item => item.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  return (
    <div className="dashboard">
      {selectedItem ? (
        <NewSummary
          item={selectedItem}
          travelInfo={selectedItemTravelInfo}
          onBack={handleBack}
          isDashboardNavigate={true}
        />
      ) : (
        <>
          <div className="tabs">
            <button
              className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => handleTabClick('pending')}
            >
              Waiting for My Approval
            </button>
            <button
              className={`tab-button ${activeTab === 'approved' ? 'active' : ''}`}
              onClick={() => handleTabClick('approved')}
            >
              Approved By Me
            </button>
            <button
              className={`tab-button ${activeTab === 'rejected' ? 'active' : ''}`}
              onClick={() => handleTabClick('rejected')}
            >
              Denied By Me
            </button>
          </div>

          <div className="search-box-container">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-box"
            />
          </div>

          <div className="toolbar2">
            <div className="toolbar2-content">
              <span>
              {activeTab === 'pending' && 'Waiting for My Approval'}
              {activeTab === 'approved' && 'Approved By Me'}
              {activeTab === 'rejected' && 'Denied By Me'}
              </span>
            </div>
          </div>

          <div className="tab-content">
            {loading ? (
              <div className="loading">Loading...</div>
            ) : (
              <>
                <table className="table-dashboard">
                  <thead className='thead'>
                    <tr>
                      <th className="th">Travel Number</th>
                      <th className="th">Name</th>
                      <th className="th">Travel Purpose</th>
                      <th className="th">Approver 1</th>
                      <th className="th">Approver 2</th>
                      <th className="th">Budget</th>
                      <th className="th">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.length > 0 ? (
                      filteredData.map(item => (
                        <tr key={item.id}>
                          <td className="td">
                            <span
                              className="clickable-id"
                              onClick={() => handleIdClick(item)}
                            >
                              {item.id || 'N/A'}
                            </span>
                          </td>
                          <td className="td">{`${item.firstName || 'N/A'} ${item.lastName || 'N/A'}`}</td>
                          <td className="td">{item.travelPurpose || 'N/A'}</td>
                          <td className="td">{item.manager || 'N/A'}</td>
                          <td className="td">{item.hod || 'N/A'}</td>
                          <td className="td">{item.travelBudget || 'N/A'}</td>
                          <td className="td">{item.approveStatus?.name || 'N/A'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="no-data">No data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <div className="pagination">
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    shape="rounded"
                    variant="outlined"
                    color="primary"
                  />
                </div>

                <div style={{ marginTop: '10px' }}>
                  Items per page:
                  <select
                    value={itemsPerPage}
                    onChange={handleItemsPerPageChange}
                    style={{ marginLeft: '10px' }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
