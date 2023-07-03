
import tensorflow as tf
from tensorflow import keras

import rnn_model
import json
from easydict import EasyDict
import numpy as np
import dataset
from tqdm import tqdm

#####################   loading model   #####################
with open('./0010-15.11.2020..05.25__human_seg/params.txt') as fp:
    params = EasyDict(json.load(fp))

model_fn = './0010-15.11.2020..05.25__human_seg/learned_model.keras'

params.model_fn = "./0010-15.11.2020..05.25__human_seg/learned_model.keras"
params.new_run = 0
params.mix_models_in_minibatch = False
params.batch_size = 1
params.net_input.append('vertex_indices')
params.n_walks_per_model = 32
params.net_input_dim = 4

model = rnn_model.RnnWalkNet(params, params.n_classes, params.net_input_dim-1 , model_fn, model_must_be_load=True,
                                       dump_model_visualization=False)

model.load_weights('./0010-15.11.2020..05.25__human_seg/learned_model.keras')

print(model.summary())
###################  prediction ###################
# dataset_expansion = params.datasets2use['test'][0]
# min_max_faces2use = params.test_min_max_faces2use[0]
# data_augmentation = {}

# test_dataset, n_models_to_test = dataset.tf_mesh_dataset(params, dataset_expansion, mode=params.network_task,
#                                                            shuffle_size=0, permute_file_names=True, min_max_faces2use=min_max_faces2use,
#                                                            must_run_on_all=True, data_augmentation=data_augmentation)

# n_pos_all = 0
# n_classes = 40
# all_confusion = np.zeros((n_classes, n_classes), dtype=np.int)
# pred_per_model_name = {}
# dnn_model = model
# print("bbbbbbbbb  \n",test_dataset)
# for i, data in tqdm(enumerate(test_dataset), total=n_models_to_test):
#     name, ftrs, gt = data
#     print("name ===> \n",name)
#     print("ftrs ===> \n",ftrs)
#     print("gt ===> \n",gt)
#     # model_fn = name.numpy()[0].decode()
#     assert ftrs.shape[0] == 1, 'Must have one model per batch for test'
#     ftrs = tf.reshape(ftrs, ftrs.shape[1:])
#     gt = gt.numpy()[0]
#     ftr2use = ftrs.numpy()
#     print("ftr2use ===> \n",ftr2use)
#     predictions = dnn_model(ftr2use, classify=True, training=False).numpy()
#     print("prdictions ===> \n",predictions)

