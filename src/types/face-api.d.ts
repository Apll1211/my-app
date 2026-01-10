declare module "face-api.js" {
	export interface TinyFaceDetectorOptions {
		inputSize?: number;
		scoreThreshold?: number;
	}

	export interface WithFaceLandmarks {
		landmarks: FaceLandmarks68;
	}

	export interface FaceLandmarks68 {
		getLeftEye(): Array<{ x: number; y: number }>;
		getRightEye(): Array<{ x: number; y: number }>;
		getNose(): Array<{ x: number; y: number }>;
		getJawOutline(): Array<{ x: number; y: number }>;
	}

	export interface FaceDetection {
		box: {
			x: number;
			y: number;
			width: number;
			height: number;
		};
	}

	export interface WithFaceDetection {
		detection: FaceDetection;
	}

	export interface DetectedFace extends WithFaceDetection, WithFaceLandmarks {}

	export const nets: {
		tinyFaceDetector: {
			loadFromUri(uri: string): Promise<void>;
		};
		faceLandmark68TinyNet: {
			loadFromUri(uri: string): Promise<void>;
		};
	};

	export function detectSingleFace(
		input: HTMLVideoElement,
		options?: TinyFaceDetectorOptions
	): Promise<DetectedFace | null>;

	export function detectSingleFace(
		input: HTMLVideoElement,
		options: TinyFaceDetectorOptions
	): Promise<DetectedFace | null>;

	export function detectSingleFace(
		input: HTMLVideoElement,
		options: TinyFaceDetectorOptions
	): Promise<DetectedFace | null>;
}