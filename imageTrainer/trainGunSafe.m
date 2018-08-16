
% Training performed using steps laid out in tutorial here:
% https://www.mathworks.com/help/vision/ug/train-a-cascade-object-detector.html

% Run this program to label ROIs for object-class detector
%  trainingImageLabeler


% Now load the training data for positives
% load roi_guns.mat


% Specify negative images dir
negImg = [cd '\neg_guns'];

% train 5 stages for the detector ('Haar', 'LBP', or 'HOG')
% 456_12negatives_set2.xml
% trainCascadeObjectDetector('out.xml',...
%     roi_guns, negImg,...
%    'FalseAlarmRate',0.05,...
%    'TruePositiveRate',0.995,...
%    'NumCascadeStages',8,...
%    'FeatureType','HOG');



%% Now run the classifier on an image
detector = vision.CascadeObjectDetector('out.xml');

folder = pwd;
filePattern = fullfile(folder, '*.jpg');
f = dir(filePattern);
files = {f.name};
for k = 1:numel(files)
	fullFileName = fullfile(folder, files{k});
	Images{k} = imread(fullFileName);
end


% find the bounding boxes
for k=1:numel(files)

    % find bounding boxes
    bbox = step(detector,Images{k});
	
	% if gun is detected, call emergency alert stub
	if size(bbox,1) > 0
		sendEmergencyAlert();
	end
		
  
    % Display result
    figure(k),clf
    imshow(Images{k})
    hold off
      
    %display bouding boxes
    for j = 1:size(bbox,1)
    rectangle('Position', bbox(j,:),'EdgeColor','r', 'LineWidth', 3)
    end
    
    % Save output files
    outFilename = sprintf('%s_%d.jpg','out_image',k)   ; 
    saveas(figure(k), outFilename);
end