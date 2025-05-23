import os
import glob
from pydub import AudioSegment
from pydub.exceptions import CouldntDecodeError

def normalize_audio_files(input_dir, output_dir, target_dbfs=-20.0):
    """
    Normalizes all MP3 and OGG audio files in the input directory to a target dBFS level
    and saves them to the output directory.

    Args:
        input_dir (str): Path to the directory containing input audio files.
        output_dir (str): Path to the directory where normalized files will be saved.
        target_dbfs (float): The target loudness in dBFS (decibels relative to full scale).
                             Default is -20.0 dBFS.
    """

    # Create the output directory if it doesn't exist
    if not os.path.exists(output_dir):
        try:
            os.makedirs(output_dir)
            print(f"Created output directory: {output_dir}")
        except OSError as e:
            print(f"Error creating output directory {output_dir}: {e}")
            return

    # Supported file types
    supported_extensions = ("*.mp3", "*.ogg")
    audio_files_found = []

    print(f"\nScanning for audio files in: {input_dir}")
    for ext in supported_extensions:
        # Using recursive=True to find files in subdirectories as well
        # If you only want to scan the top-level directory, set recursive=False
        search_pattern = os.path.join(input_dir, "**", ext)
        audio_files_found.extend(glob.glob(search_pattern, recursive=True))

    if not audio_files_found:
        print("No MP3 or OGG files found in the input directory (and its subdirectories).")
        return

    print(f"Found {len(audio_files_found)} audio file(s) to process.")
    print(f"Target loudness: {target_dbfs} dBFS")
    print("-" * 30)

    processed_count = 0
    failed_count = 0

    for file_path in audio_files_found:
        try:
            print(f"Processing: {file_path}...")

            # Determine file extension for export
            file_name = os.path.basename(file_path)
            file_format = file_name.split('.')[-1].lower()

            if file_format not in ["mp3", "ogg"]: # Should not happen due to glob pattern
                print(f"Skipping unsupported file format: {file_name}")
                continue

            # Load the audio file
            audio = AudioSegment.from_file(file_path, format=file_format)

            # Calculate the difference between the current loudness and the target loudness
            change_in_dbfs = target_dbfs - audio.dBFS

            # Apply the gain to normalize the audio
            normalized_audio = audio.apply_gain(change_in_dbfs)

            # Construct the output path
            # This preserves the subdirectory structure from input_dir to output_dir
            relative_path = os.path.relpath(file_path, input_dir)
            output_file_path = os.path.join(output_dir, relative_path)

            # Ensure the subdirectory exists in the output directory
            output_file_dir = os.path.dirname(output_file_path)
            if not os.path.exists(output_file_dir):
                os.makedirs(output_file_dir)

            # Export the normalized audio
            # For MP3, you can specify bitrate, e.g., bitrate="192k"
            if file_format == "mp3":
                normalized_audio.export(output_file_path, format="mp3")
            elif file_format == "ogg":
                normalized_audio.export(output_file_path, format="ogg")

            print(f"Successfully normalized and saved to: {output_file_path}")
            processed_count += 1

        except CouldntDecodeError:
            print(f"Error: Could not decode {file_path}. It might be corrupted or not a valid audio file.")
            failed_count += 1
        except FileNotFoundError:
            # This can happen if ffmpeg/ffprobe is not found
            print(f"Error: Could not process {file_path}. Ensure ffmpeg or libav is installed and in your PATH.")
            print("pydub requires ffmpeg or libav to process MP3 and OGG files.")
            failed_count += 1
            # Stop further processing if ffmpeg seems to be the issue for the first file
            if processed_count == 0 and failed_count == 1:
                print("Aborting due to likely missing ffmpeg/libav.")
                break
        except Exception as e:
            print(f"An unexpected error occurred while processing {file_path}: {e}")
            failed_count += 1
        print("-" * 30)


    print("\nNormalization process finished.")
    print(f"Successfully processed: {processed_count} file(s)")
    print(f"Failed to process: {failed_count} file(s)")

if __name__ == "__main__":
    print("Audio Normalization Script")
    print("--------------------------")
    print("This script will normalize MP3 and OGG files to a consistent loudness.")
    print("Make sure you have pydub and ffmpeg (or libav) installed.")
    print("Original files will NOT be modified. Normalized files are saved in the output directory.\n")

    try:
        input_directory = input("Enter the path to the input directory (containing your audio files): ")
        output_directory = input("Enter the path to the output directory (for normalized files): ")

        while True:
            try:
                target_level_str = input("Enter the target loudness in dBFS (e.g., -20.0, press Enter for default -20.0): ")
                if not target_level_str:
                    target_level = -20.0
                    break
                target_level = float(target_level_str)
                break
            except ValueError:
                print("Invalid input. Please enter a number (e.g., -18.5).")

        if not os.path.isdir(input_directory):
            print(f"Error: Input directory '{input_directory}' not found.")
        elif input_directory == output_directory:
            print("Error: Input and output directories cannot be the same. Please choose a different output directory.")
        else:
            normalize_audio_files(input_directory, output_directory, target_level)

    except KeyboardInterrupt:
        print("\nProcess interrupted by user.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

