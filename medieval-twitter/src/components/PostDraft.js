import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Picture, NameUsername, Post } from './Post';
import { BsImage, BsImageFill } from 'react-icons/bs';
import { RiFileGifLine, RiFileGifFill } from 'react-icons/ri';
import { db, auth, storage } from '../firebase'; // Import your Firebase configuration file
import axios from 'axios';

export const ExternalFiles = () => {
  const [image, selectImage] = useState(false);
  const [gif, selectGif] = useState(false);
  const [file, selectFile] = useState(null);
  const [imageURL, setImageURL] = useState('');

  const fileSelectorHandler = (event) => {
    console.log(event.target.files[0]);
    selectFile(event.target.files[0]);
  };

  const uploadFileHandler = () => {
    if (!file) {
      console.log('No file selected.');
      return;
    }
  
    const storageRef = storage.ref();
    const imageRef = storageRef.child(auth.currentUser.uid + '/' + file.name);
  
    // Upload the file to Firebase Storage
    imageRef
      .put(file)
      .then((snapshot) => {
        console.log('File uploaded successfully!', snapshot);
        return snapshot.ref.getDownloadURL();
      })
      .then((downloadURL) => {
        console.log('Image URL:', downloadURL);
        setImageURL(downloadURL); // Set the image URL state
      })
      .catch((error) => {
        console.error('Error uploading file:', error);
      });
  };

  return (
    <div className=" flex">
      <input type='file' onChange={fileSelectorHandler} />
      <button
        className="m-3 mt-7 ml-0"
        onClick={() => {
          uploadFileHandler();
          selectImage(!image);
        }}
      >
        {image ? <BsImageFill size="20" /> : <BsImage size="20" />}
      </button>

      <button className="m-3 mt-7 ml-0" onClick={() => selectGif(!gif)}>
        {gif ? <RiFileGifFill size="20" /> : <RiFileGifLine size="20" />}
      </button>

      {imageURL && <img src={imageURL} alt="Uploaded" />}
    </div>
  );
};
const PostDraft = () => {

  const [postContent, setPostContent] = useState('');
  const navigate = useNavigate();

  // character count
  const [charCount, setCharCount] = useState(0);

  // word limit
  const limit = 20;

  const handleTextAreaChange = (event) => {
    setPostContent(event.target.value);
  };

  useEffect(() => {
    if (charCount > limit - 1) {
        console.log("Character Allowance Reached!!!");
        setPostContent(postContent.slice(0, limit));
    } 
    // update char count (including whitespaces)
    setCharCount(postContent.length);
}, [postContent]);

  const handlePostSubmission = () => {
    if (postContent) {
      db.collection('posts')
        .add({
          text: postContent,
          userID: auth.currentUser.uid,
          likes: 0,
          dislikes: 0,
          timestamp: new Date(),
        })
        .then((docRef) => {
          console.log('Post submitted successfully with ID:', docRef.id);
  
          // Now, add a 'comments' collection to the document with a sample comment
          db.collection('posts')
            .doc(docRef.id) // Reference to the newly added post document
            .collection('comments') // Add 'comments' collection to the post document
            .add({
              text: 'Sample comment',
              userID: auth.currentUser.uid,
              timestamp: new Date(),
            })
            .then(() => {
              console.log('Comment added successfully to the post!');
            }).then (() => {
                navigate('/home');
            })
            .catch((error) => {
              console.error('Error adding comment to the post:', error);
            });
        })
        .catch((error) => {
          console.error('Error submitting post:', error);
        });
    }
  };

  return (
    <div className="m-auto p-10 shadow-md w-1/2 h-1/4">
      <div className="flex">
        <div className="mb-5">
          <Picture />
        </div>
        <NameUsername />
      </div>
      <div>
        <textarea
          placeholder="Start your post here..."
          className="w-full text-black-500 border rounded"
          value={postContent}
          onChange={handleTextAreaChange}
        />
      </div>
      <p id='word-count'>Character allowance: {charCount}/{limit}</p>

      <ExternalFiles />
      <div>
        <button
          className="float-right text-black-500 border border-black-500 hover:bg-blue-500 hover:text-white active:bg-blue-600 nt-bold uppercase text-xs px-4 py-2 rounded outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
          type="button"
          onClick={handlePostSubmission}
        > Submit
        </button>
      </div>
    </div>
  );
};

export default PostDraft;