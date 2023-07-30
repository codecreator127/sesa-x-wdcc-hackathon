import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; // Import your Firebase configuration file


function FriendItem({ id, name, email, activeTab }) {
  const [buttonLabel, setButtonLabel] = useState('Add');

  useEffect(() => {
    if (activeTab === 'Requests') {
      if (buttonLabel !== 'Accept Request') {
        setButtonLabel('Accept Request');
      }
    } else if (activeTab === 'Pending') {
      if (buttonLabel !== 'Withdraw Request') {
        setButtonLabel('Withdraw Request');
      }
    } else if (activeTab == 'Add Friends') {
      if (buttonLabel !== 'Add') {
        setButtonLabel('Add');
      }
    } else {
      setButtonLabel(null);

    }
  }, [activeTab, buttonLabel]);

  const handleRequest = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const currentUserId = currentUser.uid;

      if (activeTab === 'Requests' && buttonLabel === 'Accept Request') {
        // Handle the request acceptance logic
        await db.collection('users').doc(currentUserId).collection('requests').doc(id).delete();
        await db.collection('users').doc(currentUserId).collection('friends').doc(id).set({});
        await db.collection('users').doc(id).collection('friends').doc(currentUserId).set({});
        console.log(id + ' accepted');
      } else if (activeTab === 'Pending' && buttonLabel === 'Withdraw Request') {
        // Handle the request withdrawal logic
        await db.collection('users').doc(currentUserId).collection('pending').doc(id).delete();
        await db.collection('users').doc(id).collection('requests').doc(currentUserId).delete();
        console.log(id + ' request withdrawn');
      } else if (activeTab == 'Add Friends') {
        // Adding friends logic
        await db.collection('users').doc(id).collection('requests').doc(currentUserId).set({});
        await db.collection('users').doc(currentUserId).collection('pending').doc(id).set({});
        
        console.log(id + ' requested');
      }
    } catch (error) {
      console.log('Error handling request:', error);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white hover:bg-gray-100">
      <div>
        <p className="text-lg font-medium text-gray-800">{name}</p>
        <p className="text-sm text-gray-500">{id}</p>
        <p className="text-sm text-gray-500">{email}</p>
      </div>
      {buttonLabel && (
        <button className="px-3 py-1 bg-blue-500 text-white rounded-full" onClick={handleRequest}>
          {buttonLabel}
        </button>
      )}
    </div>
  );
}


function FriendList({ friends, activeTab }) {
  const [friendInfo, setFriendInfo] = useState([]);

  useEffect(() => {
    // Fetch user information for each friend using the getUserInfo function
    const fetchFriendInfo = async () => {
      const friendInfoPromises = friends.map((friendId) => getUserInfo(friendId));
      const friendInfoData = await Promise.all(friendInfoPromises);
      setFriendInfo(friendInfoData);
    };

    fetchFriendInfo();
  }, [friends]);

  return (
    <div className="flex flex-col space-y-2">
      {friendInfo.map((friend) => (
        <FriendItem key={friend.id} id={friend.id} name={friend.name} email={friend.email} activeTab={activeTab}/>
      ))}
    </div>
  );
}

async function getUserInfo(userId) {
  try {
    const userRef = db.collection('users').doc(userId);
    const userSnapshot = await userRef.get();

    if (userSnapshot.exists) {
      const userData = userSnapshot.data();
      const { name, email } = userData;

      return { id: userId, name, email };
    } else {
      // Handle the case where the user document does not exist
      return null;
    }
  } catch (error) {
    console.log('Error fetching user info:', error);
    return null;
  }
}


function FriendSystem() {
    const [searchTerm, setSearchTerm] = useState('');

    const [allUsers, setUsers] = useState([]);
    const [friends, setFriends] = useState([]);
    const [pending, setPendingRequests] = useState([]);
    const [requests, setOutgoingRequests] = useState([]);


    const [activeTab, setActiveTab] = useState('All');

    useEffect(() => {
      // Function to fetch the current user's friends from Firestore
      const fetchCurrentUserFriends = async () => {
        try {
          // Get the current user's ID from Firebase Auth
          const currentUser = auth.currentUser;
          if (currentUser) {
            const currentUserId = currentUser.uid;
  
            // Fetch the current user's friends from Firestore
            const friendsSnapshot = await db.collection('users').doc(currentUserId).collection('friends').get();
            const friendsData = friendsSnapshot.docs.map((doc) => doc.id);
            setFriends(friendsData);
          }
        } catch (error) {
          console.log('Error fetching current user friends:', error);
        }
      };
  
      // Function to fetch the current user's pending requests from Firestore
      const fetchCurrentUserPending = async () => {
        try {
          // Get the current user's ID from Firebase Auth
          const currentUser = auth.currentUser;
          if (currentUser) {
            const currentUserId = currentUser.uid;
  
            // Fetch the current user's pending requests from Firestore
            const pendingSnapshot = await db.collection('users').doc(currentUserId).collection('pending').get();
            const pendingData = pendingSnapshot.docs.map((doc) => doc.id);
            setPendingRequests(pendingData);
          }
        } catch (error) {
          console.log('Error fetching current user pending requests:', error);
        }
      };

      // Function to fetch the current user's requests collection from Firestore
      const fetchCurrentUserRequests = async () => {
        try {
          // Get the current user's ID from Firebase Auth
          const currentUser = auth.currentUser;
          if (currentUser) {
            const currentUserId = currentUser.uid;
  
            // Fetch the current user's pending requests from Firestore
            const requestsSnapshot = await db.collection('users').doc(currentUserId).collection('requests').get();
            const requestsData = requestsSnapshot.docs.map((doc) => doc.id);
            setOutgoingRequests(requestsData);

          }
        } catch (error) {
          console.log('Error fetching current user requests requests:', error);
        }
      };

      const fetchAllUsers = async () => {
        try {
          // Fetch the current user's friends from Firestore
          const usersSnapshot = await db.collection('users').get();
          const friendsData = usersSnapshot.docs.map((doc) => doc.id);
          setUsers(friendsData);

        } catch (error) {
          console.log('Error fetching current user friends:', error);
        }
      };
      fetchCurrentUserFriends();
      fetchCurrentUserPending();
      fetchCurrentUserRequests();
      fetchAllUsers();
    }, []);
  
  
    const filterFriendsByTab = () => {
      // Filter friends based on the active tab
      switch (activeTab) {
        case 'Friends':
          return friends;
        case 'Pending':
          return pending;
        case 'Requests':
          return requests;
        case 'Add Friends':
          return allUsers;
        default:
          return friends;
      }
    };
  
    const filteredFriends = filterFriendsByTab();
  

    return (
      <div className="p-4 bg-gray-100">
        <h2 className="text-xl font-bold mb-4">Friends</h2>
        <div className="bg-white rounded-md shadow-md">  
          {/* Tabs */}
          <div className="flex bg-gray-200">
            <button
              className={`px-4 py-2 flex-1 text-center ${
                activeTab === 'All' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'
              }`}
              onClick={() => setActiveTab('Friends')}
            >
              All Friends
            </button>
            <button
              className={`px-4 py-2 flex-1 text-center ${
                activeTab === 'Pending' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'
              }`}
              onClick={() => setActiveTab('Pending')}
            >
              Pending
            </button>
            <button
              className={`px-4 py-2 flex-1 text-center ${
                activeTab === 'Requests' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'
              }`}
              onClick={() => setActiveTab('Requests')}
            >
              Requests
            </button>
            <button
              className={`px-4 py-2 flex-1 text-center ${
                activeTab === 'Add Friends' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'
              }`}
              onClick={() => setActiveTab('Add Friends')}
            >
              Add Friends
            </button>
          </div>
          <div className="flex items-center justify-between p-4">
            {/* Search bar only displayed when activeTab is 'All' or 'Add Friends' */}
            {(activeTab === 'All' || activeTab === 'Add Friends') && (
              <>
                <input
                  type="text"
                  placeholder="Search friends..."
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="px-4 py-2 ml-2 bg-blue-500 text-white rounded-lg">Search</button>
              </>
            )}
          </div>
  
          <FriendList friends={filteredFriends} activeTab={activeTab}/>
        </div>
      </div>
    );
  }
  
  export default FriendSystem;