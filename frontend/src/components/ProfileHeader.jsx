import {useState, useRef} from "react";
import {LogOutIcon, VolumeOffIcon, Volume2Icon} from "lucide-react";
import {useAuthStore} from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
const mouseClickSound= new Audio("/sounds/mouse-click.mp3");

function ProfileHeader() {

    const {logout, authUser, updateProfile} = useAuthStore();
    const {isSoundEnabled, toggleSound}= useChatStore();
    const [selectedImg, setSelectedImg]= useState(null);


    const fileInputRef = useRef(null);


   const handleImageUpload = (e) => {
  const file = e.target.files[0];

  if (!file) return;

  const reader = new FileReader();
  reader.readAsDataURL(file);

  reader.onload = async () => {
    const base64Image = reader.result;
    
    // Compress the image
    const compressedImage = await compressImage(base64Image, 800, 0.7);
    
    setSelectedImg(compressedImage);
    await updateProfile({ profilePic: compressedImage });
  };
};

// Add this helper function to compress images
const compressImage = (base64, maxWidth = 800, quality = 0.7) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Resize if image is too large
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Compress to JPEG with quality setting
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
  });
};

      return (
   <div className="p-6 border-b border-slate-700/50">
  <div className="flex items-center justify-between">
    
    {/* LEFT: avatar + name */}
    <div className="flex items-center gap-3">
      <div className="avatar online">
        <button
          className="size-14 rounded-full overflow-hidden relative group"
          onClick={() => fileInputRef.current.click()}
        >
          <img
            src={selectedImg || authUser?.profilePic || "/avatar.png"}
            alt="User Image"
            className="size-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100
          flex items-center justify-center transition-opacity">
            <span className="text-white text-xs">Change</span>
          </div>
        </button>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      <div>
        <h3 className="text-slate-200 font-medium text-base max-w-[180px] truncate">
          {authUser?.fullname}
        </h3>
        <p className="text-slate-400 text-xs">Online</p>
      </div>
    </div>

    {/* RIGHT: buttons */}
    <div className="flex items-center gap-4">
      <button
        className="text-slate-400 hover:text-red-400 transition-colors"
        onClick={logout}
      >
        <LogOutIcon className="size-5" />
      </button>

      {/* Sound btn */}
       <button
            className="text-slate-400 hover:text-slate-200 transition-colors"
            onClick={() => {
              // play click sound before toggling
              mouseClickSound.currentTime = 0; // reset to start
              mouseClickSound.play().catch((error) => console.log("Audio play failed:", error));
              toggleSound();
            }}
          >
            {isSoundEnabled ? (
              <Volume2Icon className="size-5" />
            ) : (
              <VolumeOffIcon className="size-5" />
            )}
          </button>

    </div>


  </div>
</div>

    
      )
  
}

export default ProfileHeader