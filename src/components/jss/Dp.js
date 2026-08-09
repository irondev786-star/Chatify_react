import axios from "axios";
import React, { useState } from "react";
import API_URL from "./backend_Url";
import { useNavigate } from "react-router-dom";

const ImagePicker = () => {

    const navigation = useNavigate();

    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);

    function handleImageChange(e) {

        const file = e.target.files[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            alert("Please select an image");
            return;
        }

        setImage(file);
        setPreview(URL.createObjectURL(file));
    }

    async function handleAdd() {

        if (!image) {
            alert("Please select an image first");
            return;
        }

        setUploading(true);

        try {

            const formData = new FormData();

            formData.append(
                "file",
                image
            );

            formData.append(
                "upload_preset",
                "Chatify"
            );

            const response = await fetch(
                "https://api.cloudinary.com/v1_1/wlqi15zk/image/upload",
                {
                    method: "POST",
                    body: formData
                }
            );

            const data = await response.json();

            if (!response.ok) {

                console.log(
                    "Cloudinary error:",
                    data
                );

                alert(
                    data.error?.message ||
                    "Image upload failed"
                );

                return;
            }

            console.log(
                "Cloudinary response:",
                data
            );

            console.log(
                "Image URL:",
                data.secure_url
            );

            console.log(
                "Public ID:",
                data.public_id
            );

            await axios.put(
                API_URL + "/Profile",
                {
                    pic_url: data.secure_url
                },
                {
                    withCredentials: true
                }
            );

            console.log(
                "Profile picture updated"
            );

            navigation("/Home");

        } catch (error) {

            console.log(
                "Image upload error:",
                error
            );

            alert(
                "Something went wrong while uploading the image"
            );

        } finally {

            setUploading(false);

        }
    }

    return (

        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#ffffff",
                padding: "20px",
                boxSizing: "border-box"
            }}
        >

            <div
                style={{
                    width: "320px",
                    padding: "25px",
                    backgroundColor: "#000000",
                    borderRadius: "16px",
                    boxSizing: "border-box",
                    textAlign: "center",
                    boxShadow:
                        "0 10px 30px rgba(0,0,0,0.25)"
                }}
            >

                <h2
                    style={{
                        color: "#ffffff",
                        margin: "0 0 20px 0",
                        fontSize: "22px",
                        fontWeight: "600"
                    }}
                >
                    Select Image
                </h2>

                <input
                    type="file"
                    accept="image/*"
                    id="imagePicker"
                    style={{
                        display: "none"
                    }}
                    onChange={
                        handleImageChange
                    }
                />

                <label
                    htmlFor="imagePicker"
                    style={{
                        display: "flex",
                        width: "100%",
                        height: "220px",
                        border:
                            "2px dashed #ffffff",
                        borderRadius: "12px",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        overflow: "hidden",
                        backgroundColor: "#111111",
                        boxSizing: "border-box"
                    }}
                >

                    {preview ? (

                        <img
                            src={preview}
                            alt="Selected"
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover"
                            }}
                        />

                    ) : (

                        <div
                            style={{
                                color: "#ffffff",
                                fontSize: "15px"
                            }}
                        >
                            Click to select image
                        </div>

                    )}

                </label>

                <button
                    onClick={handleAdd}
                    disabled={uploading}
                    style={{
                        width: "100%",
                        marginTop: "18px",
                        padding: "12px",
                        border: "none",
                        borderRadius: "8px",
                        backgroundColor:
                            uploading
                                ? "#777777"
                                : "#ffffff",
                        color: "#000000",
                        fontSize: "16px",
                        fontWeight: "600",
                        cursor:
                            uploading
                                ? "not-allowed"
                                : "pointer"
                    }}
                >
                    {uploading
                        ? "Uploading..."
                        : "Add"}
                </button>

            </div>

        </div>

    );
};

export default ImagePicker;